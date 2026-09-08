import { useState, useEffect } from 'react';

const FilterPanel = ({
  materia: initialMateria = '',
  contentIds: initialContentIds = [],
  searchQuery: initialSearchQuery = '',
  apenasErros: initialApenasErros = false,
  naoRespondidas: initialNaoRespondidas = false,
  onFilterChange,
  contents = []
}) => {
  const [materia, setMateria] = useState(initialMateria);
  const [contentIds, setContentIds] = useState(initialContentIds);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [apenasErros, setApenasErros] = useState(initialApenasErros);
  const [naoRespondidas, setNaoRespondidas] = useState(initialNaoRespondidas);

  useEffect(() => {
    setMateria(initialMateria);
    setContentIds(initialContentIds);
    setSearchQuery(initialSearchQuery);
    setApenasErros(initialApenasErros);
    setNaoRespondidas(initialNaoRespondidas);
  }, [initialMateria, initialContentIds, initialSearchQuery, initialApenasErros, initialNaoRespondidas]);

  // Deriva opcoes do backend
  const materiasDisponiveis = [...new Set(contents.map(c => c.materia))].sort();
  const topicosDisponiveis = contents.filter(c => c.materia === materia).sort((a, b) => a.topico.localeCompare(b.topico));

  const handleApply = () => {
    onFilterChange({
      materia,
      contentIds,
      searchQuery,
      apenasErros,
      naoRespondidas
    });
  };

  const handleClear = () => {
    setMateria('');
    setContentIds([]);
    setSearchQuery('');
    setApenasErros(false);
    setNaoRespondidas(false);
    onFilterChange({
      materia: '',
      contentIds: [],
      searchQuery: '',
      apenasErros: false,
      naoRespondidas: false
    });
  };

  const handleMateriaChange = (e) => {
    setMateria(e.target.value);
    setContentIds([]); // Limpa os tópicos se a matéria mudar
  };

  const handleContentToggle = (id) => {
    setContentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Materia */}
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>
            Materia
          </label>
          <select 
            value={materia} 
            onChange={handleMateriaChange}
            className="w-full rounded-lg border p-2 text-sm"
            style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            <option value="">Todas as Materias</option>
            {materiasDisponiveis.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        {/* Busca Textual */}
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>
            Busca Textual
          </label>
          <input 
            type="text" 
            placeholder="Buscar por termo (ex: ACID)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border p-2 text-sm"
            style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>
      </div>

      {/* Conteudo Especifico */}
      {materia && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>
            Conteudo Específico
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
            {topicosDisponiveis.map(t => (
              <label key={t.id} className="flex items-center space-x-2 text-sm cursor-pointer p-1">
                <input 
                  type="checkbox" 
                  checked={contentIds.includes(t.id)}
                  onChange={() => handleContentToggle(t.id)}
                  className="rounded text-primary"
                />
                <span style={{ color: 'var(--color-text)' }}>{t.topico}</span>
              </label>
            ))}
            {topicosDisponiveis.length === 0 && (
              <span className="text-xs italic text-gray-500">Nenhum topico encontrado.</span>
            )}
          </div>
        </div>
      )}

      {/* Filtros rápidos e Botões de Ação */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2 gap-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle: Apenas erros */}
          <button
            type="button"
            role="checkbox"
            aria-checked={apenasErros}
            onClick={() => setApenasErros(!apenasErros)}
            className="group flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-150 select-none"
            style={{
              borderColor: apenasErros ? '#ef4444' : 'var(--color-border)',
              backgroundColor: apenasErros ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-bg)',
              color: apenasErros ? '#ef4444' : 'var(--color-text)',
            }}
          >
            <span
              className="w-4 h-4 rounded flex items-center justify-center border transition-colors"
              style={{
                borderColor: apenasErros ? '#ef4444' : 'var(--color-muted)',
                backgroundColor: apenasErros ? '#ef4444' : 'transparent',
              }}
            >
              {apenasErros && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span>Apenas questoes que eu errei</span>
            <input
              type="checkbox"
              className="sr-only"
              aria-label="Apenas questoes que eu errei"
              checked={apenasErros}
              onChange={(e) => setApenasErros(e.target.checked)}
            />
          </button>

          {/* Toggle: Não respondidas */}
          <button
            type="button"
            role="checkbox"
            aria-checked={naoRespondidas}
            onClick={() => setNaoRespondidas(!naoRespondidas)}
            className="group flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-150 select-none"
            style={{
              borderColor: naoRespondidas ? '#3b82f6' : 'var(--color-border)',
              backgroundColor: naoRespondidas ? 'rgba(59, 130, 246, 0.12)' : 'var(--color-bg)',
              color: naoRespondidas ? '#3b82f6' : 'var(--color-text)',
            }}
          >
            <span
              className="w-4 h-4 rounded flex items-center justify-center border transition-colors"
              style={{
                borderColor: naoRespondidas ? '#3b82f6' : 'var(--color-muted)',
                backgroundColor: naoRespondidas ? '#3b82f6' : 'transparent',
              }}
            >
              {naoRespondidas && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span>Não mostrar questões já respondidas</span>
            <input
              type="checkbox"
              className="sr-only"
              aria-label="Não mostrar questões já respondidas"
              checked={naoRespondidas}
              onChange={(e) => setNaoRespondidas(e.target.checked)}
            />
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          <button 
            type="button"
            onClick={handleClear}
            className="flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 hover:bg-neutral-800/40 active:scale-95 cursor-pointer"
            style={{ color: 'var(--color-muted)', borderColor: 'var(--color-border)', backgroundColor: 'transparent' }}
          >
            Limpar
          </button>
          <button 
            type="button"
            onClick={handleApply}
            className="flex-1 md:flex-none px-5 py-2 text-xs font-semibold rounded-lg text-white transition-all duration-150 active:scale-95 cursor-pointer shadow-sm hover:opacity-90 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
