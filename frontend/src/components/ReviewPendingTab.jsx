// @spec:AC-076
import { useState, useEffect, useCallback } from "react";
import { fetchPendingReview, fetchContents, classifyPendingQuestion, discardPendingQuestion } from "../api";

const EMPTY_ARRAY = [];

const ReviewPendingTab = () => {
  const [questions, setQuestions] = useState(EMPTY_ARRAY);
  const [contents, setContents] = useState(EMPTY_ARRAY);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const LIMIT = 20;

  // Per-question classification state
  const [selections, setSelections] = useState({});
  const [processing, setProcessing] = useState({});
  const [done, setDone] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchPendingReview(skip, LIMIT),
      fetchContents(),
    ])
      .then(([qs, cs]) => {
        setQuestions(qs || []);
        setContents(cs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [skip]);

  useEffect(() => { load(); }, [load]);

  const materiasDisponiveis = [...new Set(contents.map((c) => c.materia))].sort();

  const topicosFor = (materia) =>
    contents
      .filter((c) => c.materia === materia)
      .sort((a, b) => a.topico.localeCompare(b.topico));

  const setMateria = (id, materia) =>
    setSelections((prev) => ({ ...prev, [id]: { materia, topico: "" } }));

  const setTopico = (id, topico) =>
    setSelections((prev) => ({ ...prev, [id]: { ...prev[id], topico } }));

  const handleClassify = async (id) => {
    const sel = selections[id] || {};
    if (!sel.materia || !sel.topico) return;
    setProcessing((prev) => ({ ...prev, [id]: true }));
    try {
      await classifyPendingQuestion(id, sel.materia, sel.topico);
      setDone((prev) => ({ ...prev, [id]: "classified" }));
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDiscard = async (id) => {
    setProcessing((prev) => ({ ...prev, [id]: true }));
    try {
      await discardPendingQuestion(id);
      setDone((prev) => ({ ...prev, [id]: "discarded" }));
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const pending = questions.filter((q) => !done[q.id]);
  const resolved = questions.filter((q) => done[q.id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--color-text)" }}>
          Revisao de Questoes Pendentes
        </h2>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Questoes extraidas de provas FCC que o Gemini nao conseguiu classificar automaticamente.
          Classifique ou descarte cada uma.
        </p>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>Carregando...</p>
      ) : pending.length === 0 && resolved.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Nenhuma questao pendente de classificacao.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((q) => {
            const sel = selections[q.id] || {};
            const isProc = processing[q.id];

            return (
              <div
                key={q.id}
                className="rounded-lg border p-4 space-y-3"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                {/* Sugestao do Gemini */}
                {(q.suggested_materia || q.suggested_topico) && (
                  <p className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "rgba(245,158,11,0.08)", color: "#fbbf24" }}>
                    Sugestao Gemini: {[q.suggested_materia, q.suggested_topico].filter(Boolean).join(" / ")}
                  </p>
                )}

                {/* Enunciado */}
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
                  {q.question_number && (
                    <span className="font-mono mr-2" style={{ color: "var(--color-muted)" }}>Q.{q.question_number}</span>
                  )}
                  {q.statement}
                </p>

                {/* Alternativas (somente leitura) */}
                {q.options && (
                  <div className="space-y-1">
                    {Object.entries(q.options).map(([k, v]) => (
                      <p key={k} className="text-xs" style={{ color: "var(--color-muted)" }}>
                        <span className="font-mono mr-1">{k})</span>{v}
                      </p>
                    ))}
                  </div>
                )}

                {/* Selecao de materia e topico */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    className="flex-1 rounded-md px-2 py-1.5 text-xs outline-none cursor-pointer"
                    style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                    value={sel.materia || ""}
                    onChange={(e) => setMateria(q.id, e.target.value)}
                  >
                    <option value="">Selecione a materia</option>
                    {materiasDisponiveis.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    className="flex-1 rounded-md px-2 py-1.5 text-xs outline-none cursor-pointer"
                    style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                    value={sel.topico || ""}
                    onChange={(e) => setTopico(q.id, e.target.value)}
                    disabled={!sel.materia}
                  >
                    <option value="">Selecione o topico</option>
                    {topicosFor(sel.materia || "").map((t) => (
                      <option key={t.id} value={t.topico}>{t.topico}</option>
                    ))}
                  </select>
                </div>

                {/* Acoes */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleClassify(q.id)}
                    disabled={isProc || !sel.materia || !sel.topico}
                    className="flex-1 py-1.5 rounded-md text-xs font-medium transition-opacity cursor-pointer"
                    style={{ backgroundColor: "#2563eb", color: "#fff", opacity: (isProc || !sel.materia || !sel.topico) ? 0.5 : 1 }}
                  >
                    {isProc ? "Salvando..." : "Confirmar"}
                  </button>
                  <button
                    onClick={() => handleDiscard(q.id)}
                    disabled={isProc}
                    className="px-4 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors"
                    style={{ borderColor: "#ef4444", color: "#ef4444", backgroundColor: "transparent", opacity: isProc ? 0.5 : 1 }}
                  >
                    Descartar
                  </button>
                </div>
              </div>
            );
          })}

          {/* Resolvidos nesta sessao */}
          {resolved.length > 0 && (
            <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>
                Resolvidos nesta sessao ({resolved.length})
              </p>
              {resolved.map((q) => (
                <div key={q.id} className="flex items-center justify-between py-1.5 text-xs" style={{ color: "var(--color-muted)" }}>
                  <span className="truncate max-w-xs">{q.statement.slice(0, 80)}...</span>
                  <span
                    className="ml-2 px-2 py-0.5 rounded-full text-xs flex-shrink-0"
                    style={{
                      backgroundColor: done[q.id] === "classified" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: done[q.id] === "classified" ? "#4ade80" : "#f87171",
                    }}
                  >
                    {done[q.id] === "classified" ? "Classificada" : "Descartada"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Paginacao */}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setSkip(Math.max(0, skip - LIMIT))}
              disabled={skip === 0}
              className="text-xs px-3 py-1 rounded border cursor-pointer"
              style={{ borderColor: "var(--color-border)", color: "var(--color-muted)", opacity: skip === 0 ? 0.4 : 1 }}
            >
              Anterior
            </button>
            <button
              onClick={() => setSkip(skip + LIMIT)}
              disabled={questions.length < LIMIT}
              className="text-xs px-3 py-1 rounded border cursor-pointer"
              style={{ borderColor: "var(--color-border)", color: "var(--color-muted)", opacity: questions.length < LIMIT ? 0.4 : 1 }}
            >
              Proxima pagina
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewPendingTab;
