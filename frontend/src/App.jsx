import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TheoryTab from './components/TheoryTab';
import QuestionsTab from './components/QuestionsTab';
import ReviewTab from './components/ReviewTab';
import { fetchDailySession } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('theory');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailySession()
      .then(data => {
        setSessionData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const tabs = [
    { id: 'theory', label: 'Teoria' },
    { id: 'questions', label: 'Questões' },
    { id: 'review', label: 'Revisão Reversa' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-b border-gray-800 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-6 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="text-center mt-20 text-gray-500">Carregando sessão...</div>
        ) : (
          <div>
            {activeTab === 'theory' && <TheoryTab theories={sessionData?.theories} />}
            {activeTab === 'questions' && <QuestionsTab questions={sessionData?.questions} />}
            {activeTab === 'review' && <ReviewTab />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
