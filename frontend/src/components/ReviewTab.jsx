// @spec:AC-009
import { useState, useEffect } from 'react';

const ReviewTab = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || '/api';
    fetch(`${API_URL}/session/review`)
      .then(res => res.json())
      .then(data => {
        setReviews(data.review_items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="text-sm text-center mt-10" style={{ color: 'var(--color-muted)' }}>
      Carregando revisao...
    </div>
  );

  if (reviews.length === 0) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
          Sem erros recentes
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Voce nao tem questoes para revisar agora.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 pb-20">
      <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>
        Revisao Reversa: {reviews.length} questoes que voce errou
      </p>

      {reviews.map((item, idx) => (
        <div key={idx} className="rounded-xl border p-5" style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text)' }}>
            {item.question.statement}
          </p>

          <div className="space-y-2 mb-4">
            <div className="p-3 rounded-lg border text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              <span className="font-semibold">Sua resposta ({item.chosen_option}):</span>{' '}
              {item.question.options[item.chosen_option]}
            </div>
            <div className="p-3 rounded-lg border text-sm"
              style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)', color: '#86efac' }}>
              <span className="font-semibold">Gabarito ({item.question.correct_option}):</span>{' '}
              {item.question.options[item.question.correct_option]}
            </div>
          </div>

          {item.question.related_theory_text && (
            <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-muted)' }}>
                Justificativa
              </h4>
              <p className="text-xs leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--color-muted)' }}>
                {item.question.related_theory_text}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewTab;
