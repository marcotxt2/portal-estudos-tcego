// @spec:AC-009 @spec:AC-020
import { useQuestions } from '../context/QuestionsContext';
import { submitAnswer } from '../api';

// Icone SVG Lucide Bot (substitui emoji robot - AC-009)
const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8"/>
    <rect x="3" y="8" width="18" height="12" rx="2"/>
    <circle cx="8.5" cy="14" r="1.5"/>
    <circle cx="15.5" cy="14" r="1.5"/>
    <path d="M8.5 17h7"/>
  </svg>
);

const QuestionsTab = ({ questions }) => {
  const {
    currentIndex,
    answers,
    selectedOption,
    showResult,
    handleOptionClick,
    handleConfirm: ctxHandleConfirm,
    handleNext,
    handlePrevious,
    jumpToIndex
  } = useQuestions();

  if (!questions || questions.length === 0) {
    return (
      <div className="text-sm text-center mt-10" style={{ color: 'var(--color-muted)' }}>
        Voce nao tem questoes pendentes para hoje. Excelente trabalho!
      </div>
    );
  }

  if (currentIndex >= questions.length) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Sessao Concluida!
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Voce respondeu todas as questoes de hoje.
        </p>
      </div>
    );
  }

  const question = questions[currentIndex];

  const handleConfirm = async () => {
    if (!selectedOption) return;
    const isCorrect = selectedOption === question.correct_option;
    ctxHandleConfirm();
    try {
      await submitAnswer(question.id, selectedOption, isCorrect);
    } catch (err) {
      console.error('Erro ao salvar resposta:', err);
    }
  };

  const getOptionStyle = (key) => {
    if (showResult) {
      if (key === question.correct_option) return {
        backgroundColor: 'rgba(34,197,94,0.1)',
        borderColor: '#22c55e',
        color: '#86efac',
      };
      if (key === selectedOption) return {
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderColor: '#ef4444',
        color: '#fca5a5',
      };
      return { borderColor: 'var(--color-border)', color: 'var(--color-muted)', opacity: 0.5 };
    }
    if (selectedOption === key) return {
      backgroundColor: 'rgba(37,99,235,0.1)',
      borderColor: '#2563eb',
      color: 'var(--color-text)',
    };
    return { borderColor: 'var(--color-border)', color: 'var(--color-text)' };
  };

  return (
    <div className="max-w-2xl mx-auto mt-4 pb-20">
      <div className="flex justify-between text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
        <span className="font-mono">Questao {currentIndex + 1} de {questions.length}</span>
      </div>

      <div className="rounded-xl border p-6" style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}>
        {/* Badge gabarito deduzido - SVG no lugar do emoji */}
        {question.is_ai_generated && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
            style={{ backgroundColor: 'rgba(147,51,234,0.1)', borderColor: 'rgba(147,51,234,0.3)', color: '#c084fc' }}>
            <BotIcon />
            Gabarito Deduzido pela IA
          </div>
        )}

        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-text)' }}>
          {question.statement}
        </p>

        <div className="space-y-2">
          {Object.entries(question.options).map(([key, text]) => (
            <button
              key={key}
              className="w-full text-left p-3.5 rounded-lg border text-sm transition-colors duration-150 cursor-pointer"
              style={getOptionStyle(key)}
              onClick={() => handleOptionClick(key)}
              disabled={showResult}
            >
              <span className="font-semibold mr-2">{key})</span>{text}
            </button>
          ))}
        </div>
      </div>

        {showResult && question.explanation && (
          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-muted)' }}>
              Por que esta é a resposta?
            </h3>
            {Object.entries(question.explanation).map(([key, text]) => {
              const isCorrectOpt = key === question.correct_option;
              const isSelectedOpt = key === selectedOption;
              if (!isCorrectOpt && !isSelectedOpt) return null;
              
              const color = isCorrectOpt ? '#22c55e' : '#ef4444';
              const bgColor = isCorrectOpt ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';
              return (
                <div key={key} className="p-3 rounded-lg border text-sm" style={{
                  backgroundColor: bgColor,
                  borderColor: color + '40',
                }}>
                  <span className="font-bold mr-2" style={{ color }}>{key})</span>
                  <span style={{ color: 'var(--color-text)' }}>{text}</span>
                </div>
              );
            })}
          </div>
        )}

      <div className="mt-8">
        {/* Barra de Paginação */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-30 cursor-pointer"
            style={{ color: 'var(--color-text)', backgroundColor: 'transparent' }}
          >
            &lt; Anterior
          </button>
          
          <div className="flex gap-1.5 overflow-x-auto px-2 pb-1 scrollbar-hide">
            {questions.map((q, i) => {
              const ans = answers[i];
              let bgColor = 'var(--color-surface)';
              let borderColor = 'var(--color-border)';
              let textColor = 'var(--color-muted)';
              
              if (ans?.showResult) {
                const isCorrect = ans.selectedOption === q.correct_option;
                bgColor = isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';
                borderColor = isCorrect ? '#22c55e' : '#ef4444';
                textColor = isCorrect ? '#22c55e' : '#ef4444';
              } else if (i === currentIndex) {
                borderColor = '#2563eb';
                textColor = 'var(--color-text)';
              }
              
              return (
                <button
                  key={i}
                  data-testid={`pagination-btn-${i}`}
                  onClick={() => jumpToIndex(i)}
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md text-xs font-medium border transition-colors cursor-pointer"
                  style={{ backgroundColor: bgColor, borderColor, color: textColor }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            style={{ color: 'var(--color-text)', backgroundColor: 'transparent' }}
          >
            Próxima &gt;
          </button>
        </div>

        {/* Botoes de Ação Principais */}
        <div className="flex justify-end">
          {!showResult ? (
            <button
              onClick={handleConfirm}
              disabled={!selectedOption}
              className="px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-40 transition-colors w-full sm:w-auto"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              Confirmar
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors w-full sm:w-auto"
              style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-bg)' }}
            >
              Próxima Questão
            </button>
          )}
        </div>
      </div>

      {showResult && question.related_theory_text && (
        <div className="mt-4 p-4 rounded-lg border" style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--color-muted)' }}>
            Comentario / Teoria
          </h3>
          <p className="text-xs leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--color-muted)' }}>
            {question.related_theory_text}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionsTab;
