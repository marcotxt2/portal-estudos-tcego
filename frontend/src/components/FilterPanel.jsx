import React, { useState, useEffect } from 'react';

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

      {/* Apenas Erros, Nao Respondidas e Botoes */}
      <div className="flex flex-col md:flex-row justify-between items-center pt-2 gap-4">
        <div className="flex flex-col space-y-2">
          <label className="flex items-center space-x-2 text-sm cursor-pointer">
            <input 
              type="checkbox" 
              checked={apenasErros}
              onChange={(e) => setApenasErros(e.target.checked)}
              className="rounded text-primary"
            />
            <span style={{ color: 'var(--color-text)' }}>Apenas questoes que eu errei</span>
          </label>
          <label className="flex items-center space-x-2 text-sm cursor-pointer">
            <input 
              type="checkbox" 
              checked={naoRespondidas}
              onChange={(e) => setNaoRespondidas(e.target.checked)}
              className="rounded text-primary min-w-[44px] min-h-[44px]"
            />
            <span style={{ color: 'var(--color-text)' }}>Não mostrar questões já respondidas</span>
          </label>
        </div>

        <div className="flex space-x-3 w-full md:w-auto">
          <button 
            onClick={handleClear}
            className="flex-1 md:flex-none px-4 py-2 text-sm rounded-lg font-medium border"
            style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)', backgroundColor: 'transparent' }}
          >
            Limpar
          </button>
          <button 
            onClick={handleApply}
            className="flex-1 md:flex-none px-6 py-2 text-sm rounded-lg font-medium text-white transition-opacity hover:opacity-90 shadow-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
