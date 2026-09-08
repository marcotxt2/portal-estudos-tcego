import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BancoQuestoes from '../src/components/BancoQuestoes';
import * as api from '../src/api';

vi.mock('../src/api', () => ({
  fetchContents: vi.fn(() => Promise.resolve([
    { id: 10, materia: 'Engenharia de Software', topico: 'Arquitetura' }
  ])),
  fetchFilteredQuestions: vi.fn(),
  submitAnswer: vi.fn(() => Promise.resolve({ success: true }))
}));

const mockQuestions = [
  {
    id: 1,
    statement: 'Enunciado Questao 1',
    options: { A: 'Opcao A1', B: 'Opcao B1' },
    correct_option: 'A',
    explanation: 'Explicacao detalhada Q1',
    is_ai_generated: true,
  },
  {
    id: 2,
    statement: 'Enunciado Questao 2',
    options: { A: 'Opcao A2', B: 'Opcao B2' },
    correct_option: 'B',
    explanation: 'Explicacao detalhada Q2',
    is_ai_generated: false,
  }
];

describe('BancoQuestoes - Navegacao Continua', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchFilteredQuestions.mockResolvedValue(mockQuestions);
  });

  // @spec:AC-036
  it('@spec:AC-036 exibe a primeira questao diretamente aberta com alternativas', async () => {
    render(<BancoQuestoes />);

    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 1')).toBeInTheDocument();
      expect(screen.getByText('Opcao A1')).toBeInTheDocument();
      expect(screen.getByText('Opcao B1')).toBeInTheDocument();
      expect(screen.getByText('Questao 1 de 2')).toBeInTheDocument();
    });
  });

  // @spec:AC-037
  it('@spec:AC-037 permite navegar para a proxima questao livremente sem responder', async () => {
    render(<BancoQuestoes />);

    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 1')).toBeInTheDocument();
    });

    const nextBtn = screen.getByText('Proxima >');
    expect(nextBtn).toBeEnabled();

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 2')).toBeInTheDocument();
      expect(screen.getByText('Questao 2 de 2')).toBeInTheDocument();
    });
  });

  // @spec:AC-038
  it('@spec:AC-038 navega para a questao anterior ao clicar em Anterior', async () => {
    render(<BancoQuestoes />);

    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Proxima >'));
    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 2')).toBeInTheDocument();
    });

    const prevBtn = screen.getByText('< Anterior');
    expect(prevBtn).toBeEnabled();

    fireEvent.click(prevBtn);
    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 1')).toBeInTheDocument();
      expect(screen.getByText('Questao 1 de 2')).toBeInTheDocument();
    });
  });

  // @spec:AC-039
  it('@spec:AC-039 desabilita o botao Proxima na ultima questao exibindo Fim da lista', async () => {
    render(<BancoQuestoes />);

    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Proxima >'));
    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 2')).toBeInTheDocument();
    });

    const lastBtn = screen.getByText('Fim da lista');
    expect(lastBtn).toBeDisabled();
    expect(screen.getByText('< Anterior')).toBeEnabled();
  });

  // @spec:AC-040
  it('@spec:AC-040 reinicia ponteiro para questao 1 ao aplicar novo filtro', async () => {
    render(<BancoQuestoes />);

    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 1')).toBeInTheDocument();
    });

    // Avanca para a questao 2
    fireEvent.click(screen.getByText('Proxima >'));
    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 2')).toBeInTheDocument();
    });

    // Clica em aplicar filtro
    fireEvent.click(screen.getByText('Aplicar'));

    await waitFor(() => {
      expect(screen.getByText('Questao 1 de 2')).toBeInTheDocument();
      expect(screen.getByText('Enunciado Questao 1')).toBeInTheDocument();
    });
  });

  // @spec:AC-041
  it('@spec:AC-041 nao exibe mensagens nem resquicios de sessao concluida', async () => {
    render(<BancoQuestoes />);

    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Proxima >'));
    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 2')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Sessao Concluida/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/questoes de hoje/i)).not.toBeInTheDocument();
  });

  // @spec:AC-042
  it('@spec:AC-042 da feedback imediato ao confirmar e preserva estado ao voltar', async () => {
    render(<BancoQuestoes />);

    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 1')).toBeInTheDocument();
    });

    // Seleciona alternativa A
    fireEvent.click(screen.getByText('Opcao A1'));

    // Botao confirmar habilitado
    const confirmBtn = screen.getByText('Confirmar');
    expect(confirmBtn).toBeEnabled();

    // Clica confirmar
    fireEvent.click(confirmBtn);

    // Feedback e explicacao exibidos sem mudar de tela
    await waitFor(() => {
      expect(screen.getByText('Explicacao detalhada Q1')).toBeInTheDocument();
      expect(api.submitAnswer).toHaveBeenCalledWith(1, 'A', true);
    });

    // Avanca para Q2
    fireEvent.click(screen.getByText('Proxima >'));
    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 2')).toBeInTheDocument();
    });

    // Volta para Q1 e verifica estado preservado
    fireEvent.click(screen.getByText('< Anterior'));
    await waitFor(() => {
      expect(screen.getByText('Enunciado Questao 1')).toBeInTheDocument();
      expect(screen.getByText('Explicacao detalhada Q1')).toBeInTheDocument();
      expect(screen.queryByText('Confirmar')).not.toBeInTheDocument();
    });
  });
});
