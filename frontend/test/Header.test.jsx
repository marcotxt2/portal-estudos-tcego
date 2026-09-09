// @spec:AC-012 @spec:AC-017 @spec:AC-061 @spec:AC-062 @spec:AC-063 @spec:AC-064 @spec:AC-065 @spec:AC-066
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../src/context/ThemeContext';
import { TimerProvider } from '../src/context/TimerContext';
import Header from '../src/components/Header';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser' },
    logout: vi.fn()
  })
}));

function renderHeader() {
  return render(
    <ThemeProvider>
      <TimerProvider>
        <Header />
      </TimerProvider>
    </ThemeProvider>
  );
}

describe('Header Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00Z'));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders logo and initial clock @spec:AC-012 @spec:AC-017', () => {
    renderHeader();
    expect(screen.getByText('Portal TCE-GO')).toBeInTheDocument();
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('progresses the free clock over time @spec:AC-012 @spec:AC-061', () => {
    renderHeader();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('00:00:05')).toBeInTheDocument();
  });

  it('allows pausing and resuming free timer in Header @spec:AC-061', () => {
    renderHeader();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('00:00:03')).toBeInTheDocument();

    const pauseBtn = screen.getByText('Pausar');
    act(() => {
      fireEvent.click(pauseBtn);
    });

    // Deve mudar botao para Retomar e parar contagem
    expect(screen.getByText('Retomar')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('00:00:03')).toBeInTheDocument();

    // Retoma
    const resumeBtn = screen.getByText('Retomar');
    act(() => {
      fireEvent.click(resumeBtn);
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('00:00:05')).toBeInTheDocument();
  });

  it('switches between Livre and Pomodoro modes @spec:AC-062', () => {
    renderHeader();

    // Inicialmente no modo Livre
    expect(screen.getByText('00:00:00')).toBeInTheDocument();

    // Clica para alternar para Pomodoro
    const pomodoroTab = screen.getByRole('button', { name: /pomodoro/i });
    act(() => {
      fireEvent.click(pomodoroTab);
    });

    // Agora exibe o timer regressivo e controles do Pomodoro
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('Foco')).toBeInTheDocument();
  });

  it('controls Pomodoro play, pause and skip in Header @spec:AC-063 @spec:AC-064', () => {
    renderHeader();

    // Alterna para Pomodoro
    const pomodoroTab = screen.getByRole('button', { name: /pomodoro/i });
    act(() => {
      fireEvent.click(pomodoroTab);
    });

    // Inicia Pomodoro
    const startBtn = screen.getByText('Iniciar');
    act(() => {
      fireEvent.click(startBtn);
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('24:58')).toBeInTheDocument();

    // Pular etapa (deve ir para Pausa Curta)
    const skipBtn = screen.getByText('Pular');
    act(() => {
      fireEvent.click(skipBtn);
    });

    expect(screen.getByText('05:00')).toBeInTheDocument();
    expect(screen.getByText('Pausa Curta')).toBeInTheDocument();
  });

  it('resets clock on midnight @spec:AC-012 @spec:AC-066', () => {
    renderHeader();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('00:00:05')).toBeInTheDocument();

    act(() => {
      vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('ends session when clicking Encerrar @spec:AC-012 @spec:AC-066', () => {
    renderHeader();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('00:00:05')).toBeInTheDocument();

    const btn = screen.getByText('Encerrar');
    act(() => {
      fireEvent.click(btn);
    });

    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('toggles theme on click @spec:AC-017', () => {
    renderHeader();

    const btn = screen.getByTitle('Tema escuro');
    expect(btn).toBeInTheDocument();

    act(() => {
      fireEvent.click(btn);
    });

    expect(screen.getByTitle('Tema claro')).toBeInTheDocument();
  });
});
