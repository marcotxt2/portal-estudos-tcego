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
});
