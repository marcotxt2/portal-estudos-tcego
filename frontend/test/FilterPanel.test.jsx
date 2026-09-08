import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FilterPanel from '../src/components/FilterPanel';

// Mock dos contents para testes
const mockContents = [
  { id: 1, materia: 'Banco de Dados', topico: 'SQL' },
  { id: 2, materia: 'Banco de Dados', topico: 'NoSQL' },
  { id: 3, materia: 'Engenharia de Software', topico: 'SOLID' }
];

// @spec:AC-028 @spec:AC-035
describe('FilterPanel', () => {
  it('renderiza os campos de filtro', () => {
    const { getByPlaceholderText, getByText } = render(
      <FilterPanel 
        materia="Banco de Dados" 
        contentIds={[]} 
        searchQuery="" 
        apenasErros={false} 
        onFilterChange={vi.fn()} 
        contents={mockContents} 
      />
    );
    
    expect(getByPlaceholderText('Buscar por termo (ex: ACID)')).toBeInTheDocument();
    expect(getByText('Materia')).toBeInTheDocument();
    expect(getByText('Conteudo Específico')).toBeInTheDocument();
    expect(getByText('Apenas questoes que eu errei')).toBeInTheDocument();
    expect(getByText('Aplicar')).toBeInTheDocument();
    expect(getByText('Limpar')).toBeInTheDocument();
  });

  // @spec:AC-031
  it('chama onFilterChange com os valores atualizados ao aplicar', () => {
    const onFilterChange = vi.fn();
    const { getByText, getByPlaceholderText, getByLabelText } = render(
      <FilterPanel 
        materia="" 
        contentIds={[]} 
        searchQuery="" 
        apenasErros={false}
        naoRespondidas={false}
        onFilterChange={onFilterChange} 
        contents={mockContents} 
      />
    );
    
    fireEvent.change(getByPlaceholderText('Buscar por termo (ex: ACID)'), { target: { value: 'teste' } });
    fireEvent.click(getByLabelText(/Apenas questoes que eu errei/i));
    fireEvent.click(getByText('Aplicar'));
    
    expect(onFilterChange).toHaveBeenCalledWith({
      materia: '',
      contentIds: [],
      searchQuery: 'teste',
      apenasErros: true,
      naoRespondidas: false
    });
  });
  
  it('limpa os filtros', () => {
    const onFilterChange = vi.fn();
    const { getByText } = render(
      <FilterPanel 
        materia="Banco de Dados" 
        contentIds={[1]} 
        searchQuery="teste" 
        apenasErros={true} 
        naoRespondidas={true}
        onFilterChange={onFilterChange} 
        contents={mockContents} 
      />
    );
    
    fireEvent.click(getByText('Limpar'));
    
    expect(onFilterChange).toHaveBeenCalledWith({
      materia: '',
      contentIds: [],
      searchQuery: '',
      apenasErros: false,
      naoRespondidas: false
    });
  });
});
