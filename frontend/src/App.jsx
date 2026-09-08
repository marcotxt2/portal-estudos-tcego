// @spec:AC-011 @spec:AC-009 @spec:AC-018 @spec:AC-019 @spec:AC-020
import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TheoryTab from './components/TheoryTab';
import QuestionsTab from './components/QuestionsTab';
import ReviewTab from './components/ReviewTab';
import UploadTab from './components/UploadTab';
import { UploadProvider } from './context/UploadContext';
import { QuestionsProvider } from './context/QuestionsContext';
import { fetchDailySession, fetchModules, fetchSessionByModule } from './api';

function App() {
  const [activeTab, setActiveTab] = useState('theory');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(null);

  // AC-011: extraido como funcao nomeada para ser passado como callback ao UploadContext
  const loadModules = useCallback(() => {
    fetchModules()
      .then(setModules)
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  useEffect(() => {
    setLoading(true);
    const fetchFunc = activeModule
      ? () => fetchSessionByModule(activeModule)
      : fetchDailySession;

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
    { id: 'theory',    label: 'Teoria' },
    { id: 'questions', label: 'Questoes' },
    { id: 'review',    label: 'Revisao Reversa' },
    { id: 'upload',    label: 'Upload PDF' },
  ];

  return (
    // AC-018/AC-019/AC-020: Providers envolvem o App inteiro para que o estado
    // sobreviva ao unmount dos componentes durante a troca de abas.
    <UploadProvider onUploadComplete={loadModules}>
      <QuestionsProvider>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
          <Header />

          <main className="max-w-6xl mx-auto px-6 mt-8 flex flex-col md:flex-row gap-8 pb-12">

            {/* Sidebar: Materias */}
            <aside className="w-full md:w-56 flex-shrink-0">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: 'var(--color-muted)' }}>
                Materias
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveModule(null)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer"
                  style={{
                    backgroundColor: activeModule === null ? '#2563eb' : 'transparent',
                    color: activeModule === null ? '#ffffff' : 'var(--color-muted)',
                    fontWeight: activeModule === null ? 600 : 400,
                  }}
                >
                  Revisao Diaria (Mix)
                </button>
                {modules.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModule(mod.id)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer"
                    style={{
                      backgroundColor: activeModule === mod.id ? '#2563eb' : 'transparent',
                      color: activeModule === mod.id ? '#ffffff' : 'var(--color-muted)',
                      fontWeight: activeModule === mod.id ? 600 : 400,
                    }}
                  >
                    {mod.name}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Conteudo principal */}
            <div className="flex-1 min-w-0">
              {/* Tabs de navegacao */}
              <div
                className="flex border-b mb-6 overflow-x-auto"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap cursor-pointer transition-colors"
                    style={{
                      borderColor: activeTab === tab.id ? '#2563eb' : 'transparent',
                      color: activeTab === tab.id ? '#2563eb' : 'var(--color-muted)',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Conteudo da tab */}
              {loading && activeTab !== 'upload' ? (
                <div className="text-sm mt-20 text-center" style={{ color: 'var(--color-muted)' }}>
                  Carregando sessao...
                </div>
              ) : (
                <div>
                  {activeTab === 'theory'    && <TheoryTab    theories={sessionData?.theories} />}
                  {activeTab === 'questions' && <QuestionsTab questions={sessionData?.questions} />}
                  {activeTab === 'review'    && <ReviewTab />}
                  {activeTab === 'upload'    && <UploadTab />}
                </div>
              )}
            </div>
          </main>
        </div>
      </QuestionsProvider>
    </UploadProvider>
  );
}

export default App;
