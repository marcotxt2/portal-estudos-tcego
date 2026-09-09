// @spec:AC-018 @spec:AC-019
import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { fetchUploadStatus, uploadPdf } from '../api';

const UploadContext = createContext(null);

const STORAGE_KEY = 'pending_upload_tasks';

// Mapeamento de erros Gemini (AC-015)
function mapGeminiError(msg) {
  if (!msg) return 'Erro desconhecido. Tente novamente.';
  if (/RESOURCE_EXHAUSTED|429/.test(msg))
    return 'Cota da IA esgotada. Aguarde alguns minutos e tente novamente.';
  if (/503|UNAVAILABLE/.test(msg))
    return 'Servico da IA temporariamente indisponivel. Tente novamente em instantes.';
  if (/vazio|corrompido|sem paginas/i.test(msg))
    return 'O arquivo PDF parece estar vazio ou corrompido. Verifique e tente novamente.';
  if (/404|nao encontrado|not found/i.test(msg))
    return 'Modelo de IA configurado nao encontrado. Contate o administrador.';
  return `Erro inesperado: ${msg.slice(0, 120)}`;
}

// Persiste tarefas com taskId no localStorage para sobreviver ao F5
function savePendingTasks(queue) {
  const persistable = queue
    .filter(item => item.taskId)
    .map(({ localId, fileName, taskId, status, processed_chunks, total_chunks, extracted_questions_count, errorMessage, errorMapped }) => ({
      localId, fileName, taskId, status, processed_chunks, total_chunks, extracted_questions_count, errorMessage, errorMapped,
    }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch (_) { /* storage indisponivel */ }
}

function loadPendingTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function UploadProvider({ children, onUploadComplete }) {
  const [uploadQueue, setUploadQueue] = useState(loadPendingTasks);
  const intervalsRef = useRef({});

  const updateItem = useCallback((localId, patch) => {
    setUploadQueue(q => q.map(item => item.localId === localId ? { ...item, ...patch } : item));
  }, []);

  // AC-019: centraliza polling no contexto, independente do componente montado
  const startPolling = useCallback((localId, taskId) => {
    if (intervalsRef.current[localId]) clearInterval(intervalsRef.current[localId]);

    let failedAttempts = 0;

    intervalsRef.current[localId] = setInterval(async () => {
      try {
        const status = await fetchUploadStatus(taskId);
        failedAttempts = 0;
        updateItem(localId, {
          status: status.status,
          processed_chunks: status.processed_chunks,
          total_chunks: status.total_chunks,
          extracted_questions_count: status.extracted_questions_count ?? 0,
          errorMessage: status.error_message,
        });

        if (status.status === 'completed' || status.status === 'error') {
          clearInterval(intervalsRef.current[localId]);
          delete intervalsRef.current[localId];
          if (status.status === 'completed' && onUploadComplete) {
            onUploadComplete();
          }
        }
      } catch (err) {
        failedAttempts += 1;
        console.warn(`Polling falhou para ${taskId} (tentativa ${failedAttempts}):`, err);
        if (failedAttempts >= 10) {
          clearInterval(intervalsRef.current[localId]);
          delete intervalsRef.current[localId];
          updateItem(localId, {
            status: 'error',
            errorMessage: 'Tarefa não encontrada ou erro de rede.',
          });
        }
      }
    }, 3000);
  }, [onUploadComplete, updateItem]);

  // AC-018: restaura e retoma tarefas ativas ao recarregar (F5)
  useEffect(() => {
    const saved = loadPendingTasks();
    saved.forEach(item => {
      if (item.taskId && item.status !== 'completed' && item.status !== 'error') {
        startPolling(item.localId, item.taskId);
      }
    });

    const activeIntervals = intervalsRef.current;
    return () => {
      Object.values(activeIntervals).forEach(clearInterval);
    };
  }, [startPolling]);

  // Persiste no localStorage sempre que a fila mudar
  useEffect(() => {
    savePendingTasks(uploadQueue);
  }, [uploadQueue]);

  const handleFiles = useCallback(async (files, selectedModule) => {
    if (!selectedModule) {
      alert('Selecione uma materia antes de enviar.');
      return;
    }
    const fileArray = Array.from(files).filter(f => f.type === 'application/pdf');
    if (fileArray.length === 0) return;

    const entries = fileArray.map(f => ({
      localId: `${Date.now()}-${Math.random()}`,
      fileName: f.name,
      file: f,
      taskId: null,
      status: 'uploading',
      processed_chunks: 0,
      total_chunks: 0,
      errorMessage: null,
    }));

    setUploadQueue(q => [...q, ...entries]);

    for (const entry of entries) {
      try {
        const result = await uploadPdf(selectedModule, entry.file);
        updateItem(entry.localId, { taskId: result.task_id, status: 'pending' });
        startPolling(entry.localId, result.task_id);
      } catch (err) {
        updateItem(entry.localId, {
          status: 'error',
          errorMessage: err?.message || 'Erro ao enviar arquivo.',
        });
      }
    }
  }, [startPolling, updateItem]);

  const handleDismiss = useCallback((localId) => {
    setUploadQueue(q => q.filter(item => item.localId !== localId));
  }, []);

  const clearDone = useCallback(() => {
    setUploadQueue(q => q.filter(item => item.status !== 'completed' && item.status !== 'error'));
  }, []);

  return (
    <UploadContext.Provider value={{ uploadQueue, handleFiles, handleDismiss, clearDone, mapGeminiError }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUpload must be used inside UploadProvider');
  return ctx;
}
