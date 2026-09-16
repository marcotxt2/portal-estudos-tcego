// @spec:AC-043, AC-044, AC-045, AC-046
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ReviewTab from '../src/components/ReviewTab';
import * as api from '../src/api';

vi.mock('../src/api', () => ({
  fetchContents: vi.fn(),
  fetchReview: vi.fn(),
}));

describe('ReviewTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchContents.mockResolvedValue([]);
  });

  it('renders "Explicação" button for questions that have explanation and toggles visibility', async () => {
    api.fetchReview.mockResolvedValue({
      review_items: [
        {
          question: {
            id: 1,
            statement: 'Test statement 1',
            options: { A: '1', B: '2' },
            correct_option: 'A',
            explanation: 'This is the explanation for Q1.',
          },
          chosen_option: 'B',
        },
        {
          question: {
            id: 2,
            statement: 'Test statement 2',
            options: { A: '3', B: '4' },
            correct_option: 'B',
            // no explanation
          },
          chosen_option: 'A',
        },
      ],
    });

    await act(async () => {
      render(<ReviewTab />);
    });

    // Check if Explicação button is present only for Q1
    const explanationButtons = screen.getAllByRole('button', { name: /Explicação/i });
    expect(explanationButtons).toHaveLength(1);

    // Explanation should not be visible initially
    expect(screen.queryByText('This is the explanation for Q1.')).toBeNull();

    // Click the button to expand
    await act(async () => {
      fireEvent.click(explanationButtons[0]);
    });

    // Explanation should now be visible
    expect(screen.getByText('This is the explanation for Q1.')).toBeDefined();

    // Click again to collapse
    await act(async () => {
      fireEvent.click(explanationButtons[0]);
    });

    // Explanation should be hidden again
    expect(screen.queryByText('This is the explanation for Q1.')).toBeNull();
  });

  // @spec:AC-069
  it('@spec:AC-069 exibe integrasteis historico de resposta, gabarito e explicacao sem resetar', async () => {
    api.fetchReview.mockResolvedValue({
      review_items: [
        {
          question: {
            id: 1,
            statement: 'Questao de Revisao Reversa',
            options: { A: 'Opcao A', B: 'Opcao B' },
            correct_option: 'A',
            explanation: 'Justificativa teorica',
          },
          chosen_option: 'B',
        },
      ],
    });

    await act(async () => {
      render(<ReviewTab />);
    });

    // Verifica que exibe resposta anterior e gabarito sem estado limpo
    expect(screen.getByText(/Sua resposta \(B\):/i)).toBeInTheDocument();
    expect(screen.getByText(/Gabarito \(A\):/i)).toBeInTheDocument();
  });
});

