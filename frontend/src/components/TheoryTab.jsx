

const TheoryTab = ({ theories }) => {
  if (!theories || theories.length === 0) {
    return <div className="text-gray-500 text-center mt-10">Nenhuma teoria para revisar hoje. Vá direto para as questões!</div>;
  }

  return (
    <div className="space-y-6 mt-6 pb-20">
      {theories.map((theory, idx) => (
        <div key={idx} className="bg-card p-6 rounded-xl border border-gray-800 shadow-md">
          <h2 className="text-lg font-bold text-white mb-2">{theory.title || 'Revisão'}</h2>
          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">
            {theory.content_markdown}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TheoryTab;
