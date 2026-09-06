const API_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchDailySession = async () => {
  const res = await fetch(`${API_URL}/session/daily`);
  if (!res.ok) throw new Error('Failed to fetch session');
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
