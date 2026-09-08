// @spec:AC-012 @spec:AC-017
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from '../src/context/ThemeContext';
import Header from '../src/components/Header';

describe('Header Component', () => {
  beforeEach(() => {
    localStorage.clear();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-07T12:00:00Z')); // Meio-dia
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders logo and initial clock', () => {
    // @spec:AC-012 @spec:AC-017
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    expect(screen.getByText('Portal TCE-GO')).toBeInTheDocument();
    // Inicia em 00:00:00
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('progresses the clock over time', () => {
    // @spec:AC-012
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    // Avanca 5 segundos
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('00:00:05')).toBeInTheDocument();

    // Avanca 60 segundos
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(screen.getByText('00:01:05')).toBeInTheDocument();
  });

  it('resets clock on midnight', () => {
    // @spec:AC-012
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    // Avanca para o dia seguinte para forcar virada de dia
    act(() => {
      vi.setSystemTime(new Date('2026-09-08T12:00:00Z'));
      vi.advanceTimersByTime(1000);
    });

    // O relogio deve reiniciar
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('ends session when clicking Encerrar', () => {
    // @spec:AC-012
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('00:00:05')).toBeInTheDocument();

    const btn = screen.getByText('Encerrar');
    act(() => {
      btn.click();
    });

    expect(screen.getByText('00:00:00')).toBeInTheDocument();
    
    // Confirma que o relogio volta a rodar
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('00:00:02')).toBeInTheDocument();
  });

  it('toggles theme on click', () => {
    // @spec:AC-017
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    // Inicia light (Sun/Moon depende de logica inversa de aria-label no toggle)
    const btn = screen.getByTitle('Tema escuro');
    expect(btn).toBeInTheDocument();

    act(() => {
      btn.click();
    });

    expect(screen.getByTitle('Tema claro')).toBeInTheDocument();
  });
});
