// @spec:AC-036, AC-037, AC-038, AC-039, AC-041, AC-042
import { submitAnswer } from '../api';

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

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const QuestionViewer = ({
  question,
  questionIndex,
  totalQuestions,
  savedAnswer,
  onAnswer,
  onNext,
  onPrevious,
  isFirst,
  isLast,
}) => {
  // Estado local derivado do savedAnswer (prop-driven, sem useState proprio para opcao)
  const selectedOption = savedAnswer?.selectedOption ?? null;
  const showResult = savedAnswer?.showResult ?? false;

  const handleOptionClick = (key) => {
    if (showResult) return;
    onAnswer(question.id, key, false, false); // atualiza selecao sem confirmar
  };

  const handleConfirm = async () => {
    if (!selectedOption || showResult) return;
    const isCorrect = selectedOption === question.correct_option;
    onAnswer(question.id, selectedOption, isCorrect, true); // confirma
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
      {/* Contador - AC-037 */}
      <div className="flex justify-between items-center text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
        <span className="font-mono">Questao {questionIndex + 1} de {totalQuestions}</span>
      </div>

      <div className="rounded-xl border p-6" style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}>
        {/* Badges / Metadados */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {question.source_file && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: 'rgba(59,130,246,0.1)',
                borderColor: 'rgba(59,130,246,0.25)',
                color: '#93c5fd',
              }}
              title={`Arquivo de origem: ${question.source_file}`}
            >
              <FileIcon />
              <span className="max-w-[260px] truncate">{question.source_file}</span>
            </div>
          )}

          {question.is_ai_generated && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: 'rgba(147,51,234,0.1)',
                borderColor: 'rgba(147,51,234,0.3)',
                color: '#c084fc',
              }}
            >
              <BotIcon />
              Gabarito Deduzido pela IA
            </div>
          )}
        </div>

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

      {/* Feedback - AC-042 */}
      {showResult && question.explanation && (
        <div className="mt-6 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--color-muted)' }}>
            Por que esta e a resposta?
          </h3>
          <div className="p-3 rounded-lg border text-sm" style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}>
            <span style={{ color: 'var(--color-text)' }}>{question.explanation}</span>
          </div>
        </div>
      )}

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

      {/* Navegacao - AC-037, AC-038, AC-039 */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onPrevious}
            disabled={isFirst}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-30 cursor-pointer"
            style={{ color: 'var(--color-text)', backgroundColor: 'transparent' }}
          >
            &lt; Anterior
          </button>

          {/* Botao Confirmar ou Proxima - AC-042 */}
          <div className="flex justify-end">
            {!showResult ? (
              <button
                onClick={handleConfirm}
                disabled={!selectedOption}
                className="px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-40 transition-colors"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                Confirmar
              </button>
            ) : null}
          </div>

          {/* Proxima - AC-037, AC-039 */}
          <button
            onClick={onNext}
            disabled={isLast}
            title={isLast ? 'Fim das questoes filtradas' : undefined}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-30 cursor-pointer"
            style={{ color: 'var(--color-text)', backgroundColor: 'transparent' }}
          >
            {isLast ? 'Fim da lista' : 'Proxima >'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionViewer;
