// @spec:AC-011 @spec:AC-009 @spec:AC-018 @spec:AC-019 @spec:AC-020
import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ReviewTab from './components/ReviewTab';
import UploadTab from './components/UploadTab';
import BancoQuestoes from './components/BancoQuestoes';
import { UploadProvider } from './context/UploadContext';
import { QuestionsProvider } from './context/QuestionsContext';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';

function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('banco');

  // AC-011: loadModules mantido apenas para o UploadProvider (noop se não usar mais, ou pode manter vazio)
  const loadModules = useCallback(() => {}, []);

  const tabs = [
    { id: 'banco',     label: 'Banco de Questões' },
    { id: 'review',    label: 'Revisao Reversa' },
    { id: 'upload',    label: 'Upload PDF' },
  ];

  if (loading) return <div className="min-h-screen bg-[var(--color-bg)]"></div>;
  if (!user) return <Login />;

  return (
    // AC-018/AC-019/AC-020: Providers envolvem o App inteiro para que o estado
    // sobreviva ao unmount dos componentes durante a troca de abas.
    <UploadProvider onUploadComplete={loadModules}>
      <QuestionsProvider>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
          <Header />

          <main className="max-w-6xl mx-auto px-6 mt-8 pb-12">

            {/* Conteudo principal */}
            <div className="w-full">
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
              <div>
                {activeTab === 'banco'     && <BancoQuestoes />}
                {activeTab === 'review'    && <ReviewTab />}
                {activeTab === 'upload'    && <UploadTab />}
              </div>
            </div>
          </main>
        </div>
      </QuestionsProvider>
    </UploadProvider>
  );
}

export default App;
