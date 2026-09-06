import React, { useState } from 'react';
import { submitAnswer } from '../api';

const QuestionsTab = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);

  if (!questions || questions.length === 0) {
    return <div className="text-gray-500 text-center mt-10">Você não tem questões pendentes para hoje. Excelente trabalho!</div>;
  }

  if (currentIndex >= questions.length) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold text-white mb-2">Sessão Concluída!</h2>
        <p className="text-gray-400">Você respondeu todas as questões de hoje.</p>
      </div>
    );
  }

  const question = questions[currentIndex];

  const handleOptionClick = (key) => {
    if (showResult) return;
    setSelectedOption(key);
  };

  const handleConfirm = async () => {
    if (!selectedOption) return;
    
    const isCorrect = selectedOption === question.correct_option;
    setShowResult(true);

    try {
      // Avanço assíncrono silencioso: envia resposta ao backend sem travar UI
      await submitAnswer(question.id, selectedOption, isCorrect);
    } catch (err) {
      console.error('Erro ao salvar resposta:', err);
    }
  };

  const handleNext = () => {
    setShowResult(false);
    setSelectedOption(null);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 pb-20">
      <div className="mb-4 flex justify-between text-sm text-gray-500 font-mono">
        <span>Questão {currentIndex + 1} de {questions.length}</span>
      </div>

      <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-lg">
        <p className="text-white text-base leading-relaxed mb-6">{question.statement}</p>
        
        <div className="space-y-3">
          {Object.entries(question.options).map(([key, text]) => {
            let btnClass = "w-full text-left p-4 rounded-lg border transition-all duration-200 ";
            
            if (showResult) {
              if (key === question.correct_option) {
                btnClass += "bg-green-900/30 border-green-500 text-green-100";
              } else if (key === selectedOption) {
                btnClass += "bg-red-900/30 border-red-500 text-red-100";
              } else {
                btnClass += "border-gray-800 text-gray-400 opacity-50";
              }
            } else {
              btnClass += selectedOption === key 
                ? "bg-primary/20 border-primary text-white" 
                : "border-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50";
            }

            return (
              <button 
                key={key} 
                className={btnClass}
                onClick={() => handleOptionClick(key)}
                disabled={showResult}
              >
                <span className="font-bold mr-2">{key})</span> {text}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        {!showResult ? (
          <button 
            onClick={handleConfirm}
            disabled={!selectedOption}
            className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 transition-colors"
          >
            Confirmar
          </button>
        ) : (
          <button 
            onClick={handleNext}
            className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Próxima
          </button>
        )}
      </div>
      
      {showResult && question.related_theory_text && (
        <div className="mt-6 bg-gray-900 border border-gray-700 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm font-bold mb-2 uppercase">Comentário / Teoria</h3>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{question.related_theory_text}</p>
        </div>
      )}
    </div>
  );
};

export default QuestionsTab;
