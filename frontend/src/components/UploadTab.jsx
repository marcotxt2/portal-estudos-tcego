import { useState, useEffect, useCallback } from 'react';
import { useUpload } from '../context/UploadContext';
import { fetchModules, fetchUploads } from '../api';

// --- Icones SVG Lucide ---
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// --- Barra de progresso por arquivo (AC-010) ---
function UploadCard({ item, onDismiss }) {
  const { fileName, status, processed_chunks, total_chunks, extracted_questions_count } = item;

  const percent = status === 'completed'
    ? 100
    : status === 'processing' && total_chunks > 0
      ? Math.max(5, Math.round((processed_chunks / total_chunks) * 100))
      : 0;

  let completedText = 'Extracao concluida';
  if (extracted_questions_count && extracted_questions_count > 0) {
    const qLabel = extracted_questions_count === 1 ? '1 questao extraida' : `${extracted_questions_count} questoes extraidas`;
    completedText = `Extracao concluida (${qLabel})`;
  }

  const stepLabel = {
    uploading:  'Enviando arquivo...',
    pending:    'Preparando chunks...',
    processing: `Analisando com IA (${processed_chunks}/${total_chunks} chunks)`,
    completed:  completedText,
    error:      item.errorMapped || 'Erro inesperado.',
  }[status] ?? status;

  const barColor = status === 'completed'
    ? 'bg-green-500'
    : status === 'error'
      ? 'bg-red-500'
      : 'bg-primary';

  const isIndeterminate = status === 'uploading' || status === 'pending';
  const isDone = status === 'completed' || status === 'error';

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}><FileIcon /></span>
          <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
            {fileName}
          </span>
        </div>
        {isDone && (
          <button
            onClick={() => onDismiss(item.localId)}
            className="cursor-pointer flex-shrink-0"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Remover"
          >
            <XIcon />
          </button>
        )}
      </div>

      {/* Barra de progresso */}
      <div
        className="w-full rounded-full h-1.5 overflow-hidden"
        style={{ backgroundColor: 'var(--color-border)' }}
      >
        {isIndeterminate ? (
          <div className={`${barColor} h-1.5 rounded-full w-1/2 animate-pulse opacity-70`} />
        ) : (
          <div
            className={`${barColor} h-1.5 rounded-full transition-all duration-500 ease-in-out`}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>

      {/* Label da etapa */}
      <p className="mt-2 text-xs" style={{ color: status === 'error' ? '#f87171' : 'var(--color-muted)' }}>
        {stepLabel}
      </p>
    </div>
  );
}

// --- Componente principal (AC-018: apenas apresentacao, estado vem do contexto) ---
const UploadTab = () => {
  const { uploadQueue, handleFiles, handleDismiss, mapGeminiError } = useUpload();

  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(() => {
    setLoadingHistory(true);
    fetchUploads()
      .then(data => setHistory(data || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    fetchModules().then(setModules).catch(console.error);
    loadHistory();
  }, [loadHistory]);

  // Recarrega histórico quando qualquer upload terminar com sucesso
  useEffect(() => {
    const hasCompleted = uploadQueue.some(item => item.status === 'completed');
    if (hasCompleted) {
      loadHistory();
    }
  }, [uploadQueue, loadHistory]);

  // Mapeia erros Gemini para exibicao nos cards
  const queueWithMappedErrors = uploadQueue.map(item => ({
    ...item,
    errorMapped: item.status === 'error' ? mapGeminiError(item.errorMessage) : null,
  }));

  const onFiles = (files) => handleFiles(files, selectedModule);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e) => {
    if (e.target.files?.length) onFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
          Upload de Materiais
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Envie PDFs para analise pelo Gemini. Selecione a materia e arraste ou escolha os arquivos.
        </p>
      </div>

      {/* Selecao de materia */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
          Materia
        </label>
        <select
          className="w-full rounded-md px-3 py-2 text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
        >
          <option value="">Selecione uma materia</option>
          {modules.map(m => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Dropzone (AC-014) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="rounded-lg border-2 border-dashed transition-colors duration-150 cursor-pointer"
        style={{
          borderColor: isDragOver ? '#2563eb' : 'var(--color-border)',
          backgroundColor: isDragOver ? 'rgba(37,99,235,0.05)' : 'var(--color-surface)',
          padding: '2rem 1.5rem',
        }}
        onClick={() => document.getElementById('pdf-input').click()}
      >
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <span style={{ color: isDragOver ? '#2563eb' : 'var(--color-muted)' }}>
            <UploadIcon />
          </span>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {isDragOver ? 'Solte os arquivos aqui' : 'Arraste PDFs ou clique para selecionar'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              Multiplos arquivos suportados, sem limite de quantidade
            </p>
          </div>
        </div>
        <input
          id="pdf-input"
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Fila de uploads (AC-010, AC-013) */}
      {queueWithMappedErrors.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
            {queueWithMappedErrors.length} arquivo{queueWithMappedErrors.length > 1 ? 's' : ''}
          </p>
          {queueWithMappedErrors.map(item => (
            <UploadCard key={item.localId} item={item} onDismiss={handleDismiss} />
          ))}
        </div>
      )}

      {/* Historico de materiais processados */}
      <div className="pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Historico de Materiais Processados
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              PDFs enviados e volume de questoes extraidas
            </p>
          </div>
          <button
            onClick={loadHistory}
            className="text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
          >
            Atualizar
          </button>
        </div>

        {loadingHistory && history.length === 0 ? (
          <p className="text-xs py-4" style={{ color: 'var(--color-muted)' }}>
            Carregando historico...
          </p>
        ) : history.length === 0 ? (
          <p className="text-xs py-4" style={{ color: 'var(--color-muted)' }}>
            Nenhum material processado ainda.
          </p>
        ) : (
          <div
            className="divide-y rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            {history.map(item => (
              <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}><FileIcon /></span>
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--color-text)' }}>
                      {item.filename}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      {item.module_name} &bull; {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className="font-mono font-medium px-2 py-0.5 rounded border text-[11px]"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      color: 'var(--color-text)'
                    }}
                  >
                    {item.extracted_questions_count ?? 0} {item.extracted_questions_count === 1 ? 'questao' : 'questoes'}
                  </span>
                  <span className={`text-[11px] font-medium ${
                    item.status === 'completed' ? 'text-green-400' :
                    item.status === 'error' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {item.status === 'completed' ? 'Concluido' :
                     item.status === 'error' ? 'Erro' : 'Processando'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadTab;
