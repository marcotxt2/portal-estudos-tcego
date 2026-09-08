// @spec:AC-020 @spec:AC-021
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import QuestionsTab from '../src/components/QuestionsTab';
import { QuestionsProvider } from '../src/context/QuestionsContext';
import * as api from '../src/api';

vi.mock('../src/api', () => ({
  submitAnswer: vi.fn(),
}));

const mockQuestions = [
  {
    id: 1,
    statement: 'Qual a capital do Brasil?',
    options: { A: 'São Paulo', B: 'Brasília', C: 'Rio de Janeiro', D: 'Salvador' },
    correct_option: 'B',
    is_ai_generated: false,
    related_theory_text: null,
  },
  {
    id: 2,
    statement: 'Quanto é 2 + 2?',
    options: { A: '3', B: '4', C: '5', D: '6' },
    correct_option: 'B',
    is_ai_generated: false,
    related_theory_text: null,
  },
];

// Helper: renderiza QuestionsTab dentro do Provider obrigatorio
function renderQuestionsTab(questions = mockQuestions) {
  return render(
    <QuestionsProvider>
      <QuestionsTab questions={questions} />
    </QuestionsProvider>
  );
}

describe('QuestionsTab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.submitAnswer.mockResolvedValue({});

    // Mock sessionStorage para isolar os testes
    const sessionStorageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] ?? null,
        setItem: (key, val) => { store[key] = String(val); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
      };
    })();
    Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock, writable: true });
  });

  it('renders first question on mount', () => {
    // @spec:AC-020
    renderQuestionsTab();
    expect(screen.getByText('Qual a capital do Brasil?')).toBeInTheDocument();
    expect(screen.getByText('Questao 1 de 2')).toBeInTheDocument();
  });

  it('displays empty state when no questions', () => {
    renderQuestionsTab([]);
    expect(screen.getByText(/Voce nao tem questoes pendentes/)).toBeInTheDocument();
  });

  it('selects option and confirms answer', async () => {
    // @spec:AC-020
    renderQuestionsTab();

    const optionB = screen.getByText(/Brasília/);
    fireEvent.click(optionB.closest('button'));

    const confirmBtn = screen.getByText('Confirmar');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Próxima Questão')).toBeInTheDocument();
    });

    expect(api.submitAnswer).toHaveBeenCalledWith(1, 'B', true);
  });

  it('advances to next question after clicking Proxima', async () => {
    // @spec:AC-020
    renderQuestionsTab();

    const optionB = screen.getByText(/Brasília/);
    fireEvent.click(optionB.closest('button'));

    const confirmBtn = screen.getByText('Confirmar');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Próxima Questão')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Próxima Questão'));

    await waitFor(() => {
      expect(screen.getByText('Quanto é 2 + 2?')).toBeInTheDocument();
      expect(screen.getByText('Questao 2 de 2')).toBeInTheDocument();
    });
  });

  it('shows completed state after all questions answered', async () => {
    // @spec:AC-020
    renderQuestionsTab([mockQuestions[0]]);

    const optionB = screen.getByText(/Brasília/);
    fireEvent.click(optionB.closest('button'));

    const confirmBtn = screen.getByText('Confirmar');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Próxima Questão')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Próxima Questão'));

    await waitFor(() => {
      expect(screen.getByText('Sessao Concluida!')).toBeInTheDocument();
    });
  });

  // @spec:AC-022 @spec:AC-023
  it('renders pagination and navigates backwards', async () => {
    renderQuestionsTab();
    
    // Check pagination buttons exist
    expect(screen.getByTestId('pagination-btn-0')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-btn-1')).toBeInTheDocument();
    
    // Answer Q0
    fireEvent.click(screen.getByText(/Brasília/).closest('button'));
    await act(async () => {
      fireEvent.click(screen.getByText('Confirmar'));
    });
    
    // Go Next
    fireEvent.click(screen.getByText('Próxima >'));
    await waitFor(() => {
        expect(screen.getByText('Quanto é 2 + 2?')).toBeInTheDocument();
    });
    
    // Go Prev using Previous button
    fireEvent.click(screen.getByText('< Anterior'));
    await waitFor(() => {
        expect(screen.getByText('Qual a capital do Brasil?')).toBeInTheDocument();
    });
    
    // Check that it's already answered
    expect(screen.queryByText('Confirmar')).not.toBeInTheDocument();
  });

  // @spec:AC-025
  it('displays explanation block when answered', async () => {
    const questionWithExplanation = {
      ...mockQuestions[0],
      explanation: { A: 'A is wrong', B: 'B is right', C: 'C is wrong', D: 'D is wrong' }
    };
    renderQuestionsTab([questionWithExplanation]);
    
    // Answer incorrectly (A)
    fireEvent.click(screen.getByText(/São Paulo/).closest('button'));
    await act(async () => {
      fireEvent.click(screen.getByText('Confirmar'));
    });
    
    // Should see explanation
    expect(screen.getByText(/A is wrong/)).toBeInTheDocument();
    expect(screen.getByText(/B is right/)).toBeInTheDocument();
  });
});
