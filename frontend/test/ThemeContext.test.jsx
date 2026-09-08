// @spec:AC-009 @spec:AC-017
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { useEffect } from 'react';

// Componente helper para consumir o contexto
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders with light theme by default if no localStorage and no prefers-color-scheme', () => {
    // @spec:AC-009
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles theme and updates localStorage', () => {
    // @spec:AC-009 @spec:AC-017
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    
    // Toggle to dark
    act(() => {
      toggleBtn.click();
    });

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(localStorage.getItem('theme_preference')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle back to light
    act(() => {
      toggleBtn.click();
    });

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(localStorage.getItem('theme_preference')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('respects initial value from localStorage', () => {
    // @spec:AC-009
    localStorage.setItem('theme_preference', 'dark');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
