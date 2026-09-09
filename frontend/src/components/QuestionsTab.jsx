import { useState, useEffect, useMemo } from 'react';
import { useQuestions } from '../context/QuestionsContext';
import { submitAnswer, fetchContents } from '../api';
import FilterPanel from './FilterPanel';

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

const StrikethroughIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4H9a3 3 0 0 0-2.83 4"/>
    <path d="M14 12a4 4 0 0 1 0 8H6"/>
    <line x1="4" x2="20" y1="12" y2="12"/>
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

  const [showFilter, setShowFilter] = useState(false);
  const [contents, setContents] = useState([]);
  const [filterParams, setFilterParams] = useState(null);

  // Estado puramente visual de alternativas eliminadas/riscadas
  const [eliminatedOptions, setEliminatedOptions] = useState(new Set());

  // Limpa risco ao trocar de questao
  useEffect(() => {
    setEliminatedOptions(new Set());
  }, [currentIndex]);

  const toggleEliminateOption = (key, e) => {
    e.stopPropagation();
    setEliminatedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  useEffect(() => {
    fetchContents().then(setContents).catch(console.error);
  }, []);

  const filteredQuestions = useMemo(() => {
    if (!questions) return [];
    if (!filterParams) return questions;

    return questions.filter(q => {
      // Filtro de Texto
      if (filterParams.searchQuery) {
        const query = filterParams.searchQuery.toLowerCase();
        const matchesStatement = q.statement.toLowerCase().includes(query);
        const matchesOptions = Object.values(q.options).some(opt => opt.toLowerCase().includes(query));
        if (!matchesStatement && !matchesOptions) return false;
      }
      // Filtro de Materia e Topico
      if (filterParams.materia || (filterParams.contentIds && filterParams.contentIds.length > 0)) {
        if (!q.content_id) return false;
        const content = contents.find(c => c.id === q.content_id);
        if (!content) return false;
        if (filterParams.materia && content.materia !== filterParams.materia) return false;
        if (filterParams.contentIds && filterParams.contentIds.length > 0 && !filterParams.contentIds.includes(content.id)) return false;
      }
      return true;
    });
  }, [questions, filterParams, contents]);

  if (!filteredQuestions || filteredQuestions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-4">
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className="text-xs font-semibold px-3 py-1.5 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            {showFilter ? 'Ocultar Filtros' : 'Filtrar'}
          </button>
        </div>
        {showFilter && <FilterPanel onFilterChange={setFilterParams} contents={contents} />}
        {filterParams?.naoRespondidas && questions?.length === 0 ? (
          <div className="text-center mt-10">
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              Parabéns! Você respondeu todas as questões deste filtro.
            </h2>
            <button
              onClick={() => setFilterParams({ ...filterParams, naoRespondidas: false })}
              className="mt-4 px-4 py-2 text-sm rounded-lg font-medium border transition-colors cursor-pointer"
              style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)', backgroundColor: 'transparent' }}
            >
              Limpar filtro
            </button>
          </div>
        ) : (
          <div className="text-sm text-center mt-10" style={{ color: 'var(--color-muted)' }}>
            {questions?.length > 0 ? "Nenhuma questão atende aos filtros." : "Voce nao tem questoes pendentes para hoje. Excelente trabalho!"}
          </div>
        )}
      </div>
    );
  }

  if (currentIndex >= filteredQuestions.length) {
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

  const question = filteredQuestions[currentIndex];

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
      <div className="flex justify-between items-center text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
        <span className="font-mono">Questao {currentIndex + 1} de {filteredQuestions.length}</span>
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
          onFilterChange={(params) => {
            setFilterParams(params);
            jumpToIndex(0); // Volta para a primeira questao da lista filtrada
          }} 
          contents={contents} 
        />
      )}

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
          {Object.entries(question.options).map(([key, text]) => {
            const isEliminated = eliminatedOptions.has(key);
            return (
              <div key={key} className="relative flex items-center group">
                <button
                  className={`w-full text-left p-3.5 pr-11 rounded-lg border text-sm transition-all duration-150 cursor-pointer ${
                    isEliminated ? 'opacity-40 line-through' : ''
                  }`}
                  style={getOptionStyle(key)}
                  onClick={() => handleOptionClick(key)}
                  disabled={showResult}
                >
                  <span className="font-semibold mr-2">{key})</span>
                  <span>{text}</span>
                </button>

                {!showResult && (
                  <button
                    type="button"
                    onClick={(e) => toggleEliminateOption(key, e)}
                    className={`absolute right-2.5 p-1.5 rounded transition-all cursor-pointer ${
                      isEliminated
                        ? 'text-red-500 bg-red-500/15 opacity-100'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)] opacity-40 hover:opacity-100 group-hover:opacity-100'
                    }`}
                    title={isEliminated ? 'Restaurar alternativa' : 'Riscar alternativa'}
                    aria-label={`Riscar alternativa ${key}`}
                  >
                    <StrikethroughIcon />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

        {showResult && question.explanation && (
          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-muted)' }}>
              Por que esta é a resposta?
            </h3>
            <div className="p-3 rounded-lg border text-sm" style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
            }}>
              <span style={{ color: 'var(--color-text)' }}>{question.explanation}</span>
            </div>
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
            {filteredQuestions.map((q, i) => {
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
