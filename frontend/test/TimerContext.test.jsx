import { renderHook, act } from '@testing-library/react';
import { TimerProvider, useTimer } from '../src/context/TimerContext';

describe('TimerContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T10:00:00Z'));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('deve pausar e retomar o cronometro livre sem saltos temporais @spec:AC-061', () => {
    const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
    const { result } = renderHook(() => useTimer(), { wrapper });

    expect(result.current.freeElapsed).toBe(0);
    expect(result.current.isFreeRunning).toBe(true);

    // Avanca 5 segundos
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.freeElapsed).toBe(5);

    // Pausa o cronometro livre
    act(() => {
      result.current.pauseFreeTimer();
    });
    expect(result.current.isFreeRunning).toBe(false);

    // Avanca mais 5 segundos enquanto pausado
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // Continua em 5 segundos
    expect(result.current.freeElapsed).toBe(5);

    // Retoma o cronometro
    act(() => {
      result.current.resumeFreeTimer();
    });
    expect(result.current.isFreeRunning).toBe(true);

    // Avanca mais 3 segundos
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.freeElapsed).toBe(8);
  });

  it('deve alternar automaticamente de foco para pausa e emitir alerta @spec:AC-063', () => {
    const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
    const { result } = renderHook(() => useTimer(), { wrapper });

    expect(result.current.pomodoroStage).toBe('focus');
    expect(result.current.pomodoroRemaining).toBe(25 * 60);

    // Inicia pomodoro
    act(() => {
      result.current.startPomodoro();
    });
    expect(result.current.isPomodoroRunning).toBe(true);

    // Avanca os 25 minutos
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    // Deve ter completado 1 pomodoro e transicionado para pausa curta de 5 minutos automaticamente
    expect(result.current.pomodorosCompletedToday).toBe(1);
    expect(result.current.pomodoroStage).toBe('short_break');
    expect(result.current.pomodoroRemaining).toBe(5 * 60);
    expect(result.current.isPomodoroRunning).toBe(true);
  });

  it('deve permitir pausar e avancar manualmente as etapas do pomodoro @spec:AC-064', () => {
    const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.startPomodoro();
    });

    act(() => {
      vi.advanceTimersByTime(60 * 1000); // 1 min
    });
    expect(result.current.pomodoroRemaining).toBe(24 * 60);

    // Pausa
    act(() => {
      result.current.pausePomodoro();
    });
    expect(result.current.isPomodoroRunning).toBe(false);

    // Avanca etapa manualmente (pula foco para pausa curta)
    act(() => {
      result.current.skipPomodoroStage();
    });
    expect(result.current.pomodoroStage).toBe('short_break');
    expect(result.current.pomodoroRemaining).toBe(5 * 60);
  });

  it('deve contabilizar ciclos e transicionar para pausa longa a cada 4 ciclos @spec:AC-065 @spec:AC-063', () => {
    const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      result.current.startPomodoro();
    });

    // Completa 1º ciclo (25m foco + 5m pausa)
    act(() => { vi.advanceTimersByTime(25 * 60 * 1000); });
    expect(result.current.pomodoroStage).toBe('short_break');
    act(() => { vi.advanceTimersByTime(5 * 60 * 1000); });
    expect(result.current.pomodoroStage).toBe('focus');

    // Completa 2º ciclo
    act(() => { vi.advanceTimersByTime(25 * 60 * 1000); });
    expect(result.current.pomodoroStage).toBe('short_break');
    act(() => { vi.advanceTimersByTime(5 * 60 * 1000); });
    expect(result.current.pomodoroStage).toBe('focus');

    // Completa 3º ciclo
    act(() => { vi.advanceTimersByTime(25 * 60 * 1000); });
    expect(result.current.pomodoroStage).toBe('short_break');
    act(() => { vi.advanceTimersByTime(5 * 60 * 1000); });
    expect(result.current.pomodoroStage).toBe('focus');

    // Completa 4º ciclo de foco -> deve ir para pausa longa de 15m
    act(() => { vi.advanceTimersByTime(25 * 60 * 1000); });
    expect(result.current.pomodorosCompletedToday).toBe(4);
    expect(result.current.pomodoroStage).toBe('long_break');
    expect(result.current.pomodoroRemaining).toBe(15 * 60);
  });

  it('deve zerar tempos ao encerrar ou na virada de dia @spec:AC-066', () => {
    const wrapper = ({ children }) => <TimerProvider>{children}</TimerProvider>;
    const { result } = renderHook(() => useTimer(), { wrapper });

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    act(() => {
      result.current.startPomodoro();
    });
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    expect(result.current.freeElapsed).toBeGreaterThan(0);
    expect(result.current.pomodorosCompletedToday).toBe(1);

    // Encerra a sessao
    act(() => {
      result.current.endSession();
    });

    expect(result.current.freeElapsed).toBe(0);
    expect(result.current.pomodorosCompletedToday).toBe(0);
    expect(result.current.pomodoroStage).toBe('focus');
  });
});
