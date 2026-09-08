// @spec:AC-009
const TheoryTab = ({ theories }) => {
  if (!theories || theories.length === 0) {
    return (
      <div className="text-sm text-center mt-10" style={{ color: 'var(--color-muted)' }}>
        Nenhuma teoria para revisar hoje. Va direto para as questoes!
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 pb-20">
      {theories.map((theory, idx) => (
        <div key={idx} className="rounded-xl border p-5" style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
            {theory.title || 'Revisao'}
          </h2>
          <div className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--color-muted)' }}>
            {theory.content_markdown}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TheoryTab;
