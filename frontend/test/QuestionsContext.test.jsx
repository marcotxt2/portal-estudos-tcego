import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestionsProvider, useQuestions } from '../src/context/QuestionsContext';

const TestComponent = () => {
  const { currentIndex, answers, handleOptionClick, handleConfirm, handleNext, handlePrevious, jumpToIndex } = useQuestions();
  const currentAnswer = answers[currentIndex] || {};
  
  return (
    <div>
      <span data-testid="index">{currentIndex}</span>
      <span data-testid="selected">{currentAnswer.selectedOption || 'none'}</span>
      <span data-testid="show-result">{currentAnswer.showResult ? 'yes' : 'no'}</span>
      <button onClick={() => handleOptionClick('B')}>Select B</button>
      <button onClick={handleConfirm}>Confirm</button>
      <button onClick={handleNext}>Next</button>
      <button onClick={handlePrevious}>Prev</button>
      <button onClick={() => jumpToIndex(2)}>Jump 2</button>
    </div>
  );
};

describe('QuestionsContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  // @spec:AC-023
  it('should maintain a dictionary of answers and allow bidirectional navigation', () => {
    render(
      <QuestionsProvider>
        <TestComponent />
      </QuestionsProvider>
    );

    // Initial state
    expect(screen.getByTestId('index').textContent).toBe('0');
    expect(screen.getByTestId('selected').textContent).toBe('none');

    // Answer Q0
    act(() => { screen.getByText('Select B').click(); });
    act(() => { screen.getByText('Confirm').click(); });
    expect(screen.getByTestId('selected').textContent).toBe('B');
    expect(screen.getByTestId('show-result').textContent).toBe('yes');

    // Go Next
    act(() => { screen.getByText('Next').click(); });
    expect(screen.getByTestId('index').textContent).toBe('1');
    expect(screen.getByTestId('selected').textContent).toBe('none'); // Q1 not answered

    // Go Prev (AC-023)
    act(() => { screen.getByText('Prev').click(); });
    expect(screen.getByTestId('index').textContent).toBe('0');
    expect(screen.getByTestId('selected').textContent).toBe('B'); // Q0 still answered
    expect(screen.getByTestId('show-result').textContent).toBe('yes');
    
    // Jump to Index
    act(() => { screen.getByText('Jump 2').click(); });
    expect(screen.getByTestId('index').textContent).toBe('2');
  });
});
