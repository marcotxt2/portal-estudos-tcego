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

export const fetchModules = async () => {
  const res = await fetch(`${API_URL}/modules/`);
  if (!res.ok) throw new Error('Failed to fetch modules');
  return res.json();
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
