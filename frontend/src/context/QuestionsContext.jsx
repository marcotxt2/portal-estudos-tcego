// @spec:AC-020
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const QuestionsContext = createContext(null);

const STORAGE_KEY = 'questions_progress';

function loadProgress() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function QuestionsProvider({ children }) {
  const saved = loadProgress();

  const [currentIndex, setCurrentIndex] = useState(saved?.currentIndex ?? 0);
  const [answers, setAnswers] = useState(saved?.answers ?? {});

  // Persiste no sessionStorage sempre que algum estado mudar
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ currentIndex, answers }));
    } catch (_) { /* storage indisponivel */ }
  }, [currentIndex, answers]);

  const handleOptionClick = useCallback((key) => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        selectedOption: key
      }
    }));
  }, [currentIndex]);

  const handleConfirm = useCallback(() => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        showResult: true
      }
    }));
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const jumpToIndex = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // Reseta progresso quando a lista de questoes muda (troca de modulo/sessao)
  const resetProgress = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
  }, []);

  // Compatibilidade com a view antiga enquanto refatora a UI
  const currentAnswer = answers[currentIndex] || {};
  const selectedOption = currentAnswer.selectedOption || null;
  const showResult = currentAnswer.showResult || false;

  return (
    <QuestionsContext.Provider value={{
      currentIndex,
      answers,
      selectedOption,
      showResult,
      handleOptionClick,
      handleConfirm,
      handleNext,
      handlePrevious,
      jumpToIndex,
      resetProgress,
    }}>
      {children}
    </QuestionsContext.Provider>
  );
}

export function useQuestions() {
  const ctx = useContext(QuestionsContext);
  if (!ctx) throw new Error('useQuestions must be used inside QuestionsProvider');
  return ctx;
}
