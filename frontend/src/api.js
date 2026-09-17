const API_URL = import.meta.env.VITE_API_URL || '/api';

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.reload();
  }
  
  return response;
};

// Sessoes removidas pelo pivot.

export const submitAnswer = async (question_id, chosen_option, is_correct) => {
  const res = await fetchWithAuth(`${API_URL}/answers/`, {
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
    const res = await fetchWithAuth(`${API_URL}/modules/`);
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
  
  const res = await fetchWithAuth(`${API_URL}/modules/upload/`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload PDF');
  return res.json();
};

export const fetchUploadStatus = async (taskId) => {
  const res = await fetchWithAuth(`${API_URL}/modules/upload/${taskId}/status`);
  if (!res.ok) throw new Error('Failed to fetch upload status');
  return res.json();
};

export const retryUploadTask = async (taskId) => {
  const res = await fetchWithAuth(`${API_URL}/modules/upload/${taskId}/retry`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to retry upload task');
  return res.json();
};

export const fetchUploads = async () => {
  const res = await fetchWithAuth(`${API_URL}/modules/uploads`);
  if (!res.ok) throw new Error('Failed to fetch uploads');
  return res.json();
};

export const fetchContents = async () => {
  const res = await fetchWithAuth(`${API_URL}/questions/contents`);
  if (!res.ok) throw new Error('Failed to fetch contents');
  return res.json();
};

export const fetchFilteredQuestions = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.materia) query.append('materia', params.materia);
  
  const contentIds = params.content_ids || params.contentIds;
  if (contentIds && contentIds.length > 0) {
    query.append('content_ids', contentIds.join(','));
  }
  
  const q = params.q !== undefined ? params.q : params.searchQuery;
  if (q) query.append('q', q);
  
  const apenasErros = params.apenas_erros !== undefined ? params.apenas_erros : params.apenasErros;
  if (apenasErros) query.append('apenas_erros', 'true');
  
  const naoRespondidas = params.nao_respondidas !== undefined ? params.nao_respondidas : params.naoRespondidas;
  if (naoRespondidas) query.append('nao_respondidas', 'true');

  if (params.source_type) query.append('source_type', params.source_type);
  
  if (params.limit) query.append('limit', params.limit);
  
  const res = await fetchWithAuth(`${API_URL}/questions/?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch filtered questions');
  return res.json();
};

export const fetchReview = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.materia) query.append('materia', params.materia);
  
  const contentIds = params.content_ids || params.contentIds;
  if (contentIds && contentIds.length > 0) {
    query.append('content_ids', contentIds.join(','));
  }
  
  const res = await fetchWithAuth(`${API_URL}/session/review?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch review session');
  return res.json();
};

// --- Exams (Provas FCC) ---

export const uploadExam = async (banca, cargo, ano, caderno, gabarito) => {
  const formData = new FormData();
  formData.append('banca', banca);
  formData.append('cargo', cargo);
  formData.append('ano', ano);
  formData.append('caderno', caderno);
  formData.append('gabarito', gabarito);

  const res = await fetchWithAuth(`${API_URL}/exams/upload/`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload exam');
  return res.json();
};

export const fetchExams = async () => {
  const res = await fetchWithAuth(`${API_URL}/exams/`);
  if (!res.ok) throw new Error('Failed to fetch exams');
  return res.json();
};

export const fetchPendingReview = async (skip = 0, limit = 50) => {
  const res = await fetchWithAuth(`${API_URL}/exams/pending-review/?skip=${skip}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch pending review');
  return res.json();
};

export const fetchPendingReviewCount = async () => {
  try {
    const res = await fetchWithAuth(`${API_URL}/exams/pending-review/count`);
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
  } catch {
    return 0;
  }
};

export const classifyPendingQuestion = async (id, materia, topico) => {
  const res = await fetchWithAuth(`${API_URL}/exams/pending-review/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materia, topico, discard: false }),
  });
  if (!res.ok) throw new Error('Failed to classify question');
  return res.json();
};

export const discardPendingQuestion = async (id) => {
  const res = await fetchWithAuth(`${API_URL}/exams/pending-review/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ discard: true }),
  });
  if (!res.ok) throw new Error('Failed to discard question');
  return res.json();
};

// --- Scraping / Geracao Automatica ---

export const triggerScraping = async (maxExams = 2) => {
  const res = await fetchWithAuth(`${API_URL}/generation/trigger?max_exams=${maxExams}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Falha ao disparar scraping');
  return res.json();
};

export const fetchGenerationStats = async () => {
  const res = await fetchWithAuth(`${API_URL}/generation/stats`);
  if (!res.ok) throw new Error('Falha ao buscar estatisticas de scraping');
  return res.json();
};

export const fetchGenerationLogs = async (limit = 20) => {
  const res = await fetchWithAuth(`${API_URL}/generation/logs?limit=${limit}`);
  if (!res.ok) throw new Error('Falha ao buscar logs de scraping');
  return res.json();
};

export const fetchScrapedExams = async (limit = 50) => {
  const res = await fetchWithAuth(`${API_URL}/generation/scraped?limit=${limit}`);
  if (!res.ok) throw new Error('Falha ao buscar provas scrapeadas');
  return res.json();
};

export const cancelScraping = async () => {
  const res = await fetchWithAuth(`${API_URL}/generation/cancel`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Falha ao cancelar varredura');
  return res.json();
};

export const clearScrapingErrors = async () => {
  const res = await fetchWithAuth(`${API_URL}/generation/clear-errors`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Falha ao limpar erros');
  return res.json();
};
