import { useState, useEffect } from 'react';
import { fetchModules, uploadPdf } from '../api';

const UploadTab = () => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');

  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

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
    
    try {
      const result = await uploadPdf(selectedModule, file);
      setMessage(result.message);
      setFile(null);
      // Recarrega módulos

      loadModules();
    } catch (err) {
      setMessage('Erro ao enviar PDF. Tente novamente.');
      console.error(err);
    } finally {
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

        {message && (
          <div className="mt-4 p-3 rounded bg-gray-800 text-sm text-center border border-gray-700">
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default UploadTab;
