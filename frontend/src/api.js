const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const fetchDailySession = async () => {
  const res = await fetch(`${API_URL}/session/daily`);
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
};

export const fetchSessionByModule = async (moduleId) => {
  const res = await fetch(`${API_URL}/session/module/${moduleId}`);
  if (!res.ok) throw new Error('Failed to fetch module session');
  return res.json();
};

export const submitAnswer = async (question_id, chosen_option, is_correct) => {
  const res = await fetch(`${API_URL}/answers/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_id, chosen_option, is_correct }),
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
};

// Disciplinas canonicas do TCE-GO - exibidas mesmo sem dados no banco
export const CANONICAL_MODULES = [
  { id: -1, name: 'Banco de Dados (Relacional, NoSQL, Vetorial)' },
  { id: -2, name: 'Engenharia de Software e Desenvolvimento' },
  { id: -3, name: 'Governança de TI e Contratações TIC' },
  { id: -4, name: 'IA, Ciência de Dados e Automação' },
  { id: -5, name: 'Língua Inglesa (Leitura Técnica)' },
  { id: -6, name: 'Segurança da Informação' },
  { id: -7, name: 'Sistemas Operacionais, Redes e Nuvem' },
];

export const fetchModules = async () => {
  try {
    const res = await fetch(`${API_URL}/modules/`);
    if (!res.ok) throw new Error('Failed to fetch modules');
    const data = await res.json();
    // Se o banco ainda nao tem os modulos (banco limpo), retorna a lista canonical
    if (!data || data.length === 0) return CANONICAL_MODULES;
    return data;
  } catch {
    // Fallback offline: exibe disciplinas canonicas sem bloquear a UI
    return CANONICAL_MODULES;
  }
};


export const uploadPdf = async (moduleName, file) => {
  const formData = new FormData();
  formData.append('module_name', moduleName);
  formData.append('file', file);
  
  const res = await fetch(`${API_URL}/modules/upload/`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload PDF');
  return res.json();
};

export const fetchUploadStatus = async (taskId) => {
  const res = await fetch(`${API_URL}/modules/upload/${taskId}/status`);
  if (!res.ok) throw new Error('Failed to fetch upload status');
  return res.json();
};
