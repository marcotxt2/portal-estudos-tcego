import { useState, useEffect, useRef } from 'react';
import { triggerScraping, fetchGenerationStats, fetchGenerationLogs, fetchScrapedExams, cancelScraping, clearScrapingErrors } from '../api';

const ScrapingTab = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [scrapedExams, setScrapedExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [expandedExamId, setExpandedExamId] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const pollingRef = useRef(null);

  const loadData = async () => {
    try {
      const [s, l, e] = await Promise.all([
        fetchGenerationStats(),
        fetchGenerationLogs(15),
        fetchScrapedExams(30),
      ]);
      setStats(s);
      setLogs(l);
      setScrapedExams(e);
    } catch (err) {
      console.error('Erro ao carregar dados de scraping:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    pollingRef.current = setInterval(loadData, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleTriggerNow = async (force = false) => {
    try {
      setTriggering(true);
      setStatusMessage(force ? 'Forçando reprocessamento de provas...' : 'Iniciando varredura manual de provas FCC...');
      const res = await triggerScraping(2, force);
      setStatusMessage(res.message || 'Scraping iniciado em segundo plano!');
      await loadData();
    } catch (err) {
      setStatusMessage(`Erro: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const handleCancelScraping = async () => {
    try {
      setActionLoading(true);
      setStatusMessage('Cancelando varredura em andamento...');
      const res = await cancelScraping();
      setStatusMessage(res.message || 'Varredura cancelada com sucesso!');
      await loadData();
    } catch (err) {
      setStatusMessage(`Erro ao cancelar: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearErrors = async () => {
    try {
      setActionLoading(true);
      setStatusMessage('Limpando histórico de erros...');
      const res = await clearScrapingErrors();
      setStatusMessage(res.message || 'Histórico de erros limpo!');
      await loadData();
    } catch (err) {
      setStatusMessage(`Erro ao limpar erros: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatNextRun = (isoStr) => {
    if (!isoStr) return 'Todos os dias às 05:00 BRT';
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-[var(--color-muted)]">
        Carregando dados do agendador e estatísticas...
      </div>
    );
  }

  const isCurrentlyProcessing = scrapedExams.some((e) => e.status === 'processing');
  const hasErrors = scrapedExams.some((e) => e.status === 'error' || e.status === 'cancelled') || logs.some((l) => l.status === 'error');

  return (
    <div className="space-y-6">
      {/* Banner Superior - Status do Agendamento */}
      <div
        className="rounded-xl border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor: isCurrentlyProcessing ? '#3b82f6' : stats?.scheduler_active ? '#10b981' : '#f59e0b',
              }}
            />
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              {isCurrentlyProcessing
                ? 'Varredura em Execução (Scraping Ativo)'
                : 'Coleta Automática Diária FCC'}
            </h2>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            <strong>Próxima Varredura Agendada:</strong>{' '}
            <span className="font-semibold text-emerald-400">
              {formatNextRun(stats?.next_scheduled_run)}
            </span>
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Horário fixo: <strong>05:00 BRT</strong> | Limite diário: <strong>2 provas (~60 a 100 questões)</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isCurrentlyProcessing && (
            <button
              onClick={handleCancelScraping}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold text-red-200 bg-red-950/80 border border-red-500/40 hover:bg-red-900 transition-all cursor-pointer shadow"
            >
              Cancelar Varredura Travada
            </button>
          )}

          <button
            onClick={() => handleTriggerNow(true)}
            disabled={triggering || isCurrentlyProcessing || actionLoading}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 hover:bg-amber-900/60 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow"
            title="Força o reprocessamento das provas existentes caso queira atualizar/re-extrair questões"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Forçar Re-scraping</span>
          </button>

          <button
            onClick={() => handleTriggerNow(false)}
            disabled={triggering || isCurrentlyProcessing || actionLoading}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {triggering || isCurrentlyProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Varredura em Andamento...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Puxar Questões Agora</span>
              </>
            )}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className="p-3 rounded-lg border text-xs font-medium flex justify-between items-center"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            color: '#93c5fd',
          }}
        >
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-gray-400 hover:text-white cursor-pointer ml-2">✕</button>
        </div>
      )}

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          className="p-4 rounded-xl border space-y-1"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <span className="text-xs uppercase font-semibold text-gray-400">Total Coletadas</span>
          <p className="text-2xl font-bold text-emerald-400">{stats?.total_scraped_questions || 0}</p>
          <span className="text-[11px] text-gray-500">Questões via Scraping</span>
        </div>

        <div
          className="p-4 rounded-xl border space-y-1"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <span className="text-xs uppercase font-semibold text-gray-400">Provas Ingeridas</span>
          <p className="text-2xl font-bold text-blue-400">{stats?.total_scraped_exams || 0}</p>
          <span className="text-[11px] text-gray-500">Provas FCC TI</span>
        </div>

        <div
          className="p-4 rounded-xl border space-y-1"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <span className="text-xs uppercase font-semibold text-gray-400">Última Execução</span>
          <p className="text-base font-bold text-amber-400">{stats?.last_run_status || 'Nenhuma'}</p>
          <span className="text-[11px] text-gray-500">
            {stats?.last_run_count || 0} questões ingeridas
          </span>
        </div>

        <div
          className="p-4 rounded-xl border space-y-1"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <span className="text-xs uppercase font-semibold text-gray-400">Agendador</span>
          <p className="text-base font-bold text-emerald-400">
            {stats?.scheduler_active ? 'Ativo (05:00 BRT)' : 'Inativo'}
          </p>
          <span className="text-[11px] text-gray-500">APScheduler Cron</span>
        </div>
      </div>

      {/* Provas Coletadas Recentemente */}
      <div
        className="rounded-xl border p-5 space-y-3"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
            Provas FCC Mapeadas e Coletadas
          </h3>
          {hasErrors && (
            <button
              onClick={handleClearErrors}
              disabled={actionLoading}
              className="px-3 py-1 text-xs font-semibold rounded bg-neutral-800 text-amber-300 border border-amber-500/30 hover:bg-neutral-700 cursor-pointer"
            >
              Limpar Erros
            </button>
          )}
        </div>

        {scrapedExams.length === 0 ? (
          <p className="text-xs text-gray-500 py-4">Nenhuma prova coletada ainda. Clique em &quot;Puxar Questões Agora&quot;.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-gray-400">
                  <th className="py-2">Cargo / Prova</th>
                  <th className="py-2">Órgão</th>
                  <th className="py-2">Ano</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Questões</th>
                  <th className="py-2 text-center">Detalhes / Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {scrapedExams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-neutral-800/20">
                    <td className="py-2.5 font-medium text-gray-200">{ex.cargo}</td>
                    <td className="py-2.5 text-gray-400">{ex.orgao || 'FCC'}</td>
                    <td className="py-2.5 text-gray-400">{ex.ano || '-'}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          ex.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ex.status === 'processing'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {ex.status === 'processing' ? 'Em Progresso...' : ex.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-emerald-400 font-semibold">
                      +{ex.questions_extracted || 0}
                    </td>
                    <td className="py-2.5 text-center">
                      {ex.error_message ? (
                        <button
                          onClick={() => setExpandedExamId(expandedExamId === ex.id ? null : ex.id)}
                          className="px-2 py-1 text-[10px] font-bold rounded bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 cursor-pointer"
                        >
                          {expandedExamId === ex.id ? 'Ocultar Erro' : 'Ver Erro'}
                        </button>
                      ) : (
                        <span className="text-gray-600 text-[10px]">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Painel Expansivel de Erro por Prova */}
            {expandedExamId && (
              <div className="mt-3 p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-xs font-mono text-red-200 whitespace-pre-wrap">
                <span className="font-bold text-red-400 block mb-1">Log de Erro da Prova #{expandedExamId}:</span>
                {scrapedExams.find((e) => e.id === expandedExamId)?.error_message || 'Nenhum detalhe adicional.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Histórico de Execuções e Diagnóstico de Logs */}
      <div
        className="rounded-xl border p-5 space-y-3"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
            Histórico de Execuções do Scraper
          </h3>
          {hasErrors && (
            <button
              onClick={handleClearErrors}
              disabled={actionLoading}
              className="px-3 py-1 text-xs font-semibold rounded bg-neutral-800 text-amber-300 border border-amber-500/30 hover:bg-neutral-700 cursor-pointer"
            >
              Limpar Erros
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-gray-500 py-4">Nenhum log registrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                <div
                  className="flex items-center justify-between p-3 text-xs cursor-pointer hover:bg-neutral-800/30"
                  style={{ backgroundColor: 'var(--color-bg)' }}
                  onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                >
                  <div>
                    <span className="font-semibold text-gray-300">
                      {new Date(log.run_date).toLocaleString('pt-BR')}
                    </span>
                    <span className="ml-3 text-gray-500">
                      Duração: {log.duration_seconds || 0}s
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-emerald-400 font-bold">
                      +{log.questions_generated} questões
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        log.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {expandedLogId === log.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Conteudo Expandido do Log */}
                {expandedLogId === log.id && (
                  <div className="p-4 bg-neutral-900 border-t border-neutral-800 text-xs space-y-2 font-mono">
                    {log.error_message ? (
                      <div>
                        <span className="text-red-400 font-bold block mb-1">Erros Registrados:</span>
                        <div className="p-3 bg-red-950/30 border border-red-900/50 rounded text-red-200 whitespace-pre-wrap">
                          {log.error_message}
                        </div>
                      </div>
                    ) : (
                      <p className="text-emerald-400 font-semibold">Execução concluída com sucesso sem erros.</p>
                    )}

                    {log.topics_covered && Array.isArray(log.topics_covered) && log.topics_covered.length > 0 && (
                      <div>
                        <span className="text-gray-400 font-bold block mt-2 mb-1">Provas Processadas no Lote:</span>
                        <ul className="list-disc list-inside text-gray-300 space-y-1">
                          {log.topics_covered.map((item, idx) => (
                            <li key={idx}>
                              {typeof item === 'object'
                                ? `${item.cargo || 'Prova'} (${item.ano || '-'}) -> +${item.questions || 0} questões`
                                : JSON.stringify(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapingTab;
