// @spec:AC-013 @spec:AC-014 @spec:AC-010 @spec:AC-011 @spec:AC-015 @spec:AC-018 @spec:AC-019
import { useState } from 'react';
import { useUpload } from '../context/UploadContext';
import { fetchModules } from '../api';
import { useEffect } from 'react';

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
  const { fileName, status, processed_chunks, total_chunks } = item;

  const percent = status === 'completed'
    ? 100
    : status === 'processing' && total_chunks > 0
      ? Math.max(5, Math.round((processed_chunks / total_chunks) * 100))
      : 0;

  const stepLabel = {
    uploading:  'Enviando arquivo...',
    pending:    'Preparando chunks...',
    processing: `Analisando com IA (${processed_chunks}/${total_chunks} chunks)`,
    completed:  'Extracao concluida',
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

  useEffect(() => {
    fetchModules().then(setModules).catch(console.error);
  }, []);

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
    </div>
  );
};

export default UploadTab;
