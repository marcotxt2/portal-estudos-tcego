import React, { useState, useEffect } from 'react';

const ReviewTab = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca do histórico de erros não implementada na rota /session/daily ainda, 
    // mas AC-004 cita "Revisão Reversa". Poderíamos ter um endpoint /api/session/review.
    // Simulando busca para UI por enquanto.
    const API_URL = import.meta.env.VITE_API_URL || '/api';
    fetch(`${API_URL}/session/review`)
      .then(res => res.json())
      .then(data => {
        setReviews(data.review_items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch reviews', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center mt-10 text-gray-500">Carregando revisão...</div>;

  if (reviews.length === 0) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-bold text-gray-400 mb-2">Sem erros recentes!</h2>
        <p className="text-gray-600">Você não tem questões para revisar agora.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6 pb-20">
      <div className="mb-4 text-sm text-gray-500 font-mono">
        Revisão Reversa: {reviews.length} questões que você errou
      </div>
      
      {reviews.map((item, idx) => (
        <div key={idx} className="bg-card p-6 rounded-xl border border-gray-800 shadow-md">
          <p className="text-white text-sm mb-4 leading-relaxed">{item.question.statement}</p>
          
          <div className="space-y-2 mb-4">
            <div className="p-3 rounded bg-red-900/20 border border-red-500/30 text-red-200 text-sm">
              <span className="font-bold">Sua resposta ({item.chosen_option}):</span> {item.question.options[item.chosen_option]}
            </div>
            <div className="p-3 rounded bg-green-900/20 border border-green-500/30 text-green-200 text-sm">
              <span className="font-bold">Gabarito ({item.question.correct_option}):</span> {item.question.options[item.question.correct_option]}
            </div>
          </div>
          
          {item.question.related_theory_text && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Justificativa</h4>
              <p className="text-gray-400 text-xs whitespace-pre-wrap leading-relaxed">{item.question.related_theory_text}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewTab;
