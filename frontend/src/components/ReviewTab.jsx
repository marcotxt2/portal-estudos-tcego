import { useState, useEffect } from 'react';
import FilterPanel from './FilterPanel';
import { fetchReview, fetchContents } from '../api';

const BookOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

const ReviewTab = () => {
  const [reviews, setReviews] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExplanations, setExpandedExplanations] = useState({});

  const toggleExplanation = (idx) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  useEffect(() => {
    fetchContents().then(setContents).catch(console.error);
    loadReviews({});
  }, []);

  const loadReviews = (params) => {
    setLoading(true);
    fetchReview(params)
      .then(data => {
        setReviews(data.review_items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleFilterChange = (params) => {
    loadReviews(params);
  };

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
      <div className="flex justify-between items-center text-xs font-mono mb-4" style={{ color: 'var(--color-muted)' }}>
        <span>Revisao Reversa: {reviews.length} questoes que voce errou</span>
        <button 
          onClick={() => setShowFilter(!showFilter)}
          className="font-semibold px-3 py-1.5 border rounded-lg transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          {showFilter ? 'Ocultar Filtros' : 'Filtrar'}
        </button>
      </div>

      {showFilter && (
        <FilterPanel 
          onFilterChange={handleFilterChange} 
          contents={contents} 
        />
      )}

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

          {item.question.explanation && (
            <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => toggleExplanation(idx)}
                className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80 p-2 -ml-2 rounded-lg cursor-pointer"
                style={{ color: 'var(--color-primary, #3b82f6)' }}
              >
                <BookOpenIcon />
                Explicação
              </button>

              {expandedExplanations[idx] && (
                <div className="mt-3 p-3 rounded-lg border text-sm" style={{
                  backgroundColor: 'var(--color-bg-secondary, rgba(0,0,0,0.2))',
                  borderColor: 'var(--color-border)',
                }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--color-muted)' }}>
                    Por que esta é a resposta?
                  </h3>
                  <span style={{ color: 'var(--color-text)' }}>{item.question.explanation}</span>
                </div>
              )}
            </div>
          )}

          {item.question.related_theory_text && (
            <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
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
