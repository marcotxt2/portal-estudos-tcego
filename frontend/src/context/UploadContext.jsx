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

// Persiste apenas as tarefas com taskId (objetos File nao sao serializaveis)
function savePendingTasks(queue) {
  const persistable = queue
    .filter(item => item.taskId && item.status !== 'completed' && item.status !== 'error')
    .map(({ localId, fileName, taskId, status, processed_chunks, total_chunks, errorMessage }) => ({
      localId, fileName, taskId, status, processed_chunks, total_chunks, errorMessage,
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
  const [uploadQueue, setUploadQueue] = useState([]);
  const intervalsRef = useRef({});

  const updateItem = useCallback((localId, patch) => {
    setUploadQueue(q => q.map(item => item.localId === localId ? { ...item, ...patch } : item));
  }, []);

  // AC-019: centraliza polling no contexto, independente do componente montado
  const startPolling = useCallback((localId, taskId) => {
    if (intervalsRef.current[localId]) clearInterval(intervalsRef.current[localId]);

    intervalsRef.current[localId] = setInterval(async () => {
      try {
        const status = await fetchUploadStatus(taskId);
        updateItem(localId, {
          status: status.status,
          processed_chunks: status.processed_chunks,
          total_chunks: status.total_chunks,
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
        console.error('Erro ao checar status:', err);
        clearInterval(intervalsRef.current[localId]);
        delete intervalsRef.current[localId];
        updateItem(localId, {
          status: 'error',
          errorMessage: 'Tarefa não encontrada ou erro de rede.',
        });
      }
    }, 3000);
  }, [onUploadComplete, updateItem]);

  // AC-018: restaura tarefas persistidas no localStorage ao recarregar (F5)
  useEffect(() => {
    const saved = loadPendingTasks();
    if (saved.length > 0) {
      setUploadQueue(saved);
      saved.forEach(item => {
        if (item.taskId && item.status !== 'completed' && item.status !== 'error') {
          startPolling(item.localId, item.taskId);
        }
      });
    }

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

    await Promise.allSettled(
      entries.map(async (entry) => {
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
      })
    );
  }, [startPolling, updateItem]);

  const handleDismiss = useCallback((localId) => {
    setUploadQueue(q => q.filter(item => item.localId !== localId));
  }, []);

  return (
    <UploadContext.Provider value={{ uploadQueue, handleFiles, handleDismiss, mapGeminiError }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUpload must be used inside UploadProvider');
  return ctx;
}
