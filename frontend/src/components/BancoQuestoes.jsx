// @spec:AC-036, AC-037, AC-038, AC-039, AC-040, AC-041, AC-042
import { useState, useEffect } from 'react';
import FilterPanel from './FilterPanel';
import QuestionViewer from './QuestionViewer';
import { fetchContents, fetchFilteredQuestions } from '../api';

const STORAGE_KEY_FILTERS = 'banco_questoes_filters';

const loadSavedFilters = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FILTERS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const BancoQuestoes = () => {
  const [contents, setContents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentFilters, setCurrentFilters] = useState(loadSavedFilters);
  // { [questionId]: { selectedOption: string|null, showResult: bool } }
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    fetchContents().then(setContents).catch(console.error);
    const initialFilters = loadSavedFilters();
    handleFilterChange(initialFilters);
  }, []);

  const handleFilterChange = async (params) => {
    setLoading(true);
    setCurrentIndex(0); // AC-040: reinicia ponteiro
    setCurrentFilters(params);
    try {
      localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(params));
    } catch {
      // localStorage indisponivel
    }
    try {
      const data = await fetchFilteredQuestions(params);
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // AC-042: atualiza selecao ou confirma resposta
  // confirmed=true -> showResult=true (gabarito revelado + grava backend)
  const handleAnswer = (questionId, selectedOption, isCorrect, confirmed) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        selectedOption,
        showResult: confirmed ? true : (prev[questionId]?.showResult ?? false),
      },
    }));
  };

  const currentQuestion = questions[currentIndex] ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Banco de Questoes</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Filtre e responda questoes avulsas do banco de dados do TCE-GO.
        </p>
      </div>

      <FilterPanel 
        onFilterChange={handleFilterChange} 
        contents={contents}
        materia={currentFilters.materia || ''}
        contentIds={currentFilters.contentIds || currentFilters.content_ids || []}
        searchQuery={currentFilters.searchQuery || currentFilters.q || ''}
        apenasErros={Boolean(currentFilters.apenasErros || currentFilters.apenas_erros)}
        naoRespondidas={Boolean(currentFilters.naoRespondidas || currentFilters.nao_respondidas)}
      />

      {loading && (
        <div className="text-center text-sm py-8" style={{ color: 'var(--color-muted)' }}>
          Carregando questoes...
        </div>
      )}

      {!loading && questions.length === 0 && (
        <div className="text-center text-sm py-8" style={{ color: 'var(--color-muted)' }}>
          Nenhuma questao encontrada para os filtros selecionados.
        </div>
      )}

      {/* AC-036: questao aberta diretamente, sem cards recolhidos */}
      {!loading && currentQuestion && (
        <QuestionViewer
          question={currentQuestion}
          questionIndex={currentIndex}
          totalQuestions={questions.length}
          savedAnswer={answers[currentQuestion.id] ?? null}
          onAnswer={handleAnswer}
          onNext={() => setCurrentIndex(i => Math.min(i + 1, questions.length - 1))}
          onPrevious={() => setCurrentIndex(i => Math.max(i - 1, 0))}
          isFirst={currentIndex === 0}
          isLast={currentIndex === questions.length - 1}
        />
      )}
    </div>
  );
};

export default BancoQuestoes;
