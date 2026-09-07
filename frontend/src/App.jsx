import { useState, useEffect } from 'react';
import Header from './components/Header';
import TheoryTab from './components/TheoryTab';
import QuestionsTab from './components/QuestionsTab';
import ReviewTab from './components/ReviewTab';
import UploadTab from './components/UploadTab';
import { fetchDailySession, fetchModules, fetchSessionByModule } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('theory');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(null);

  useEffect(() => {
    fetchModules().then(data => {
      setModules(data);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchFunc = activeModule ? () => fetchSessionByModule(activeModule) : fetchDailySession;
    
    fetchFunc()
      .then(data => {
        setSessionData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [activeModule]);

  const tabs = [
    { id: 'theory', label: 'Teoria' },
    { id: 'questions', label: 'Questões' },
    { id: 'review', label: 'Revisão Reversa' },
    { id: 'upload', label: 'Upload PDF' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 mt-6 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar for Modules */}
        <div className="w-full md:w-64 flex-shrink-0">
          <h2 className="text-xl font-bold text-white mb-4">Matérias</h2>
          <div className="space-y-2">
            <button
              onClick={() => setActiveModule(null)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                activeModule === null
                  ? 'bg-primary text-white font-bold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Revisão Diária (Mix)
            </button>
            {modules.map(mod => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                  activeModule === mod.id
                    ? 'bg-primary text-white font-bold'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {mod.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 border-b border-gray-800 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-6 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
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
        {loading && activeTab !== 'upload' ? (
          <div className="text-center mt-20 text-gray-500">Carregando sessão...</div>
        ) : (
          <div>
            {activeTab === 'theory' && <TheoryTab theories={sessionData?.theories} />}
            {activeTab === 'questions' && <QuestionsTab questions={sessionData?.questions} />}
            {activeTab === 'review' && <ReviewTab />}
            {activeTab === 'upload' && <UploadTab />}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default App;
