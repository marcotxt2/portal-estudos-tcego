import { useState, useEffect } from 'react';
import { fetchModules, uploadPdf, fetchUploadStatus } from '../api';

const UploadTab = () => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');

  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Progress tracking
  const [uploadTask, setUploadTask] = useState(null);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const data = await fetchModules();
      setModules(data);
    } catch (err) {
      console.error("Erro ao buscar módulos:", err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    let intervalId;
    
    if (uploadTask && (uploadTask.status === 'pending' || uploadTask.status === 'processing')) {
      intervalId = setInterval(async () => {
        try {
          const status = await fetchUploadStatus(uploadTask.id);
          setUploadTask(status);
          
          if (status.status === 'completed') {
            setMessage('Processamento da I.A concluído com sucesso!');
            setIsUploading(false);
            setFile(null);
            loadModules();
            clearInterval(intervalId);
          } else if (status.status === 'error') {
            setMessage(`Erro na I.A: ${status.error_message || 'Falha desconhecida'}`);
            setIsUploading(false);
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error("Erro ao checar status:", err);
        }
      }, 3000); // poll a cada 3 segundos
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [uploadTask]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedModule) {
      setMessage('Selecione uma matéria.');
      return;
    }
    if (!file) {
      setMessage('Selecione um arquivo PDF.');
      return;
    }

    setIsUploading(true);
    setMessage('');
    setUploadTask(null);
    
    try {
      const result = await uploadPdf(selectedModule, file);
      // Backend devolve result.task_id
      setUploadTask({
        id: result.task_id,
        status: 'pending',
        processed_chunks: 0,
        total_chunks: 0
      });
      setMessage('Enviado! Iniciando inteligência artificial...');
    } catch (err) {
      setMessage('Erro ao enviar PDF. Tente novamente.');
      console.error(err);
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-card rounded-lg shadow-inner border border-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-white">Upload de Materiais (PDF)</h2>
      <p className="text-gray-400 mb-6 text-sm">
        Envie PDFs de cursinhos ou editais. Eles serão analisados em background pelo Gemini e as teorias e questões serão extraídas para o banco de dados.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Selecione a Matéria</label>
          <select 
            className="w-full bg-background border border-gray-700 rounded-md p-2 text-white focus:ring focus:ring-primary/50 outline-none"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
          >
            <option value="">-- Selecione uma Matéria --</option>
            {modules.map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Arquivo PDF</label>
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full bg-background border border-gray-700 rounded-md p-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
          />
        </div>

        <button 
          type="submit" 
          disabled={isUploading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {isUploading ? 'Enviando...' : 'Fazer Upload e Iniciar Extração'}
        </button>

        {message && !uploadTask && (
          <div className="mt-4 p-3 rounded bg-gray-800 text-sm text-center border border-gray-700">
            {message}
          </div>
        )}

        {uploadTask && (
          <div className="mt-6 p-4 rounded-lg bg-gray-800/80 border border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-200">
                {uploadTask.status === 'pending' && "Iniciando processamento..."}
                {uploadTask.status === 'processing' && "Inteligência Artificial Analisando..."}
                {uploadTask.status === 'completed' && "Extração Concluída!"}
                {uploadTask.status === 'error' && "Falha na Extração"}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {uploadTask.status === 'processing' && uploadTask.total_chunks > 0 
                  ? `${uploadTask.processed_chunks} / ${uploadTask.total_chunks}`
                  : uploadTask.status}
              </span>
            </div>
            
            <div className="w-full bg-gray-900 rounded-full h-2.5 mb-2 overflow-hidden border border-gray-700">
              {uploadTask.status === 'pending' && (
                <div className="bg-primary h-2.5 rounded-full w-full animate-pulse opacity-50"></div>
              )}
              {uploadTask.status === 'processing' && (
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out relative overflow-hidden" 
                  style={{ width: `${Math.max(5, (uploadTask.processed_chunks / (uploadTask.total_chunks || 1)) * 100)}%` }}
                >
                  <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 animate-[translateX_2s_infinite]"></div>
                </div>
              )}
              {uploadTask.status === 'completed' && (
                <div className="bg-green-500 h-2.5 rounded-full w-full"></div>
              )}
              {uploadTask.status === 'error' && (
                <div className="bg-red-500 h-2.5 rounded-full w-full"></div>
              )}
            </div>
            
            <p className="text-xs text-gray-400 mt-2 text-center">
              {message}
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default UploadTab;
