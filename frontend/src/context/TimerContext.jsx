// @spec:AC-061 @spec:AC-062 @spec:AC-063 @spec:AC-064 @spec:AC-065 @spec:AC-066
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const TimerContext = createContext(null);

export const FOCUS_TIME = 25 * 60;
export const SHORT_BREAK_TIME = 5 * 60;
export const LONG_BREAK_TIME = 15 * 60;
export const CYCLES_PER_LONG_BREAK = 4;

const MODE_STORAGE_KEY = 'portal_timer_mode';
const FREE_STORAGE_KEY = 'portal_timer_free';
const POMODORO_STORAGE_KEY = 'portal_timer_pomodoro';

export const STAGE_LABELS = {
  focus: 'Foco',
  short_break: 'Pausa Curta',
  long_break: 'Pausa Longa',
};

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.2); // A5
    gain2.gain.setValueAtTime(0.18, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.6);
  } catch {
    // Web Audio nao suportado ou bloqueado no ambiente
  }
}

export function showDesktopNotification(title, body) {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  } catch {}
}

export const TimerProvider = ({ children }) => {
  const today = getTodayString();

  // Modo: 'free' ou 'pomodoro'
  const [timerMode, setTimerMode] = useState(() => {
    try {
      return localStorage.getItem(MODE_STORAGE_KEY) || 'free';
    } catch {
      return 'free';
    }
  });

  // Estado Cronometro Livre
  const [freeElapsed, setFreeElapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(FREE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sessionDate === today && typeof parsed.elapsed === 'number') {
          return parsed.elapsed;
        }
      }
    } catch {}
    return 0;
  });

  const [isFreeRunning, setIsFreeRunning] = useState(() => {
    try {
      const stored = localStorage.getItem(FREE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sessionDate === today && typeof parsed.isRunning === 'boolean') {
          return parsed.isRunning;
        }
      }
    } catch {}
    return true; // Por padrao inicia rodando
  });

  // Estado Pomodoro
  const [pomodoroStage, setPomodoroStage] = useState(() => {
    try {
      const stored = localStorage.getItem(POMODORO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sessionDate === today && parsed.stage) {
          return parsed.stage;
        }
      }
    } catch {}
    return 'focus';
  });

  const [pomodoroRemaining, setPomodoroRemaining] = useState(() => {
    try {
      const stored = localStorage.getItem(POMODORO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sessionDate === today && typeof parsed.remaining === 'number') {
          return parsed.remaining;
        }
      }
    } catch {}
    return FOCUS_TIME;
  });

  const [isPomodoroRunning, setIsPomodoroRunning] = useState(() => {
    try {
      const stored = localStorage.getItem(POMODORO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sessionDate === today && typeof parsed.isRunning === 'boolean') {
          return parsed.isRunning;
        }
      }
    } catch {}
    return false;
  });

  const [pomodorosCompletedToday, setPomodorosCompletedToday] = useState(() => {
    try {
      const stored = localStorage.getItem(POMODORO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sessionDate === today && typeof parsed.completedToday === 'number') {
          return parsed.completedToday;
        }
      }
    } catch {}
    return 0;
  });

  const [pomodoroCycleCount, setPomodoroCycleCount] = useState(() => {
    try {
      const stored = localStorage.getItem(POMODORO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sessionDate === today && typeof parsed.cycleCount === 'number') {
          return parsed.cycleCount;
        }
      }
    } catch {}
    return 0;
  });

  // Referencias de Timestamp Absoluto (Wall-clock) para funcionamento perfeito em segundo plano
  const lastFreeTickRef = useRef(isFreeRunning ? Date.now() : null);
  const pomodoroTargetEndRef = useRef(
    isPomodoroRunning ? Date.now() + pomodoroRemaining * 1000 : null
  );

  // Persistencia de modo
  const changeTimerMode = (newMode) => {
    setTimerMode(newMode);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, newMode);
    } catch {}
  };

  // Persistencia Free Timer
  useEffect(() => {
    try {
      localStorage.setItem(
        FREE_STORAGE_KEY,
        JSON.stringify({
          elapsed: freeElapsed,
          isRunning: isFreeRunning,
          sessionDate: getTodayString(),
        })
      );
    } catch {}
  }, [freeElapsed, isFreeRunning]);

  // Persistencia Pomodoro Timer
  useEffect(() => {
    try {
      localStorage.setItem(
        POMODORO_STORAGE_KEY,
        JSON.stringify({
          stage: pomodoroStage,
          remaining: pomodoroRemaining,
          isRunning: isPomodoroRunning,
          completedToday: pomodorosCompletedToday,
          cycleCount: pomodoroCycleCount,
          sessionDate: getTodayString(),
        })
      );
    } catch {}
  }, [pomodoroStage, pomodoroRemaining, isPomodoroRunning, pomodorosCompletedToday, pomodoroCycleCount]);

  // Checagem de virada de dia (meia-noite)
  const lastCheckedDateRef = useRef(getTodayString());
  const checkDayRollover = useCallback(() => {
    const currentToday = getTodayString();
    if (currentToday !== lastCheckedDateRef.current) {
      lastCheckedDateRef.current = currentToday;
      setFreeElapsed(0);
      setPomodoroRemaining(FOCUS_TIME);
      setPomodoroStage('focus');
      setPomodorosCompletedToday(0);
      setPomodoroCycleCount(0);
      pomodoroTargetEndRef.current = null;
      lastFreeTickRef.current = Date.now();
      return true;
    }
    return false;
  }, []);

  // Sincronizacao baseada em timestamp real (Wall-clock time)
  // Funciona mesmo quando a aba e suspensa ou throttled pelo navegador
  const syncTimers = useCallback(() => {
    const now = Date.now();
    const rolledOver = checkDayRollover();
    if (rolledOver) return;

    // 1. Sincroniza Cronometro Livre
    if (isFreeRunning) {
      if (lastFreeTickRef.current === null) {
        lastFreeTickRef.current = now;
      } else {
        const delta = Math.floor((now - lastFreeTickRef.current) / 1000);
        if (delta > 0) {
          lastFreeTickRef.current += delta * 1000;
          setFreeElapsed((prev) => prev + delta);
        }
      }
    }

    // 2. Sincroniza Pomodoro Timer
    if (isPomodoroRunning) {
      if (!pomodoroTargetEndRef.current) {
        pomodoroTargetEndRef.current = now + pomodoroRemaining * 1000;
      } else {
        const diffSec = Math.round((pomodoroTargetEndRef.current - now) / 1000);

        if (diffSec <= 0) {
          // Bloco finalizado mesmo se estava em segundo plano!
          playNotificationChime();

          if (pomodoroStage === 'focus') {
            const newCompleted = pomodorosCompletedToday + 1;
            const newCycle = pomodoroCycleCount + 1;
            setPomodorosCompletedToday(newCompleted);
            setPomodoroCycleCount(newCycle);

            const isLong = newCycle % CYCLES_PER_LONG_BREAK === 0;
            const nextStage = isLong ? 'long_break' : 'short_break';
            const nextDuration = isLong ? LONG_BREAK_TIME : SHORT_BREAK_TIME;

            setPomodoroStage(nextStage);
            setPomodoroRemaining(nextDuration);
            pomodoroTargetEndRef.current = now + nextDuration * 1000;

            showDesktopNotification(
              'Ciclo de Foco Concluído!',
              isLong ? 'Excelente! Faça uma pausa longa de 15 minutos.' : 'Ótimo trabalho! Hora de uma pausa curta de 5 minutos.'
            );
          } else {
            setPomodoroStage('focus');
            setPomodoroRemaining(FOCUS_TIME);
            pomodoroTargetEndRef.current = now + FOCUS_TIME * 1000;

            showDesktopNotification(
              'Intervalo Finalizado!',
              'Pronto para o próximo bloco de foco de 25 minutos?'
            );
          }
        } else {
          setPomodoroRemaining(diffSec);
        }
      }
    }
  }, [
    checkDayRollover,
    isFreeRunning,
    isPomodoroRunning,
    pomodoroRemaining,
    pomodoroStage,
    pomodorosCompletedToday,
    pomodoroCycleCount,
  ]);

  // Interval principal (1 segundo) + escuta de visibilitychange / window focus
  useEffect(() => {
    const interval = setInterval(() => {
      syncTimers();
    }, 1000);

    const handleVisibilityOrFocus = () => {
      syncTimers();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [syncTimers]);

  // Atualizacao dinamica do titulo da aba para visualizacao mesmo fora da aplicacao
  useEffect(() => {
    if (timerMode === 'pomodoro' && isPomodoroRunning) {
      const label = STAGE_LABELS[pomodoroStage] || 'Pomodoro';
      document.title = `(${formatCountdown(pomodoroRemaining)}) ${label} | Portal TCE-GO`;
    } else if (timerMode === 'free' && isFreeRunning) {
      document.title = `(${formatElapsed(freeElapsed)}) Portal TCE-GO`;
    } else {
      document.title = 'Portal TCE-GO';
    }

    return () => {
      document.title = 'Portal TCE-GO';
    };
  }, [timerMode, isPomodoroRunning, pomodoroRemaining, pomodoroStage, isFreeRunning, freeElapsed]);

  // Acoes Free Timer
  const pauseFreeTimer = () => {
    setIsFreeRunning(false);
    lastFreeTickRef.current = null;
  };

  const resumeFreeTimer = () => {
    lastFreeTickRef.current = Date.now();
    setIsFreeRunning(true);
  };

  const resetFreeTimer = () => {
    setFreeElapsed(0);
    lastFreeTickRef.current = Date.now();
    setIsFreeRunning(true);
  };

  // Acoes Pomodoro Timer
  const startPomodoro = () => {
    // Solicita permissao de notificacoes caso o navegador suporte
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    pomodoroTargetEndRef.current = Date.now() + pomodoroRemaining * 1000;
    setIsPomodoroRunning(true);
  };

  const pausePomodoro = () => {
    if (pomodoroTargetEndRef.current) {
      const rem = Math.max(0, Math.round((pomodoroTargetEndRef.current - Date.now()) / 1000));
      setPomodoroRemaining(rem);
    }
    pomodoroTargetEndRef.current = null;
    setIsPomodoroRunning(false);
  };

  const skipPomodoroStage = () => {
    const now = Date.now();
    if (pomodoroStage === 'focus') {
      const nextCycle = pomodoroCycleCount + 1;
      setPomodoroCycleCount(nextCycle);
      const isLong = nextCycle % CYCLES_PER_LONG_BREAK === 0;
      const nextStage = isLong ? 'long_break' : 'short_break';
      const nextDuration = isLong ? LONG_BREAK_TIME : SHORT_BREAK_TIME;

      setPomodoroStage(nextStage);
      setPomodoroRemaining(nextDuration);
      if (isPomodoroRunning) {
        pomodoroTargetEndRef.current = now + nextDuration * 1000;
      }
    } else {
      setPomodoroStage('focus');
      setPomodoroRemaining(FOCUS_TIME);
      if (isPomodoroRunning) {
        pomodoroTargetEndRef.current = now + FOCUS_TIME * 1000;
      }
    }
  };

  const resetPomodoro = () => {
    setIsPomodoroRunning(false);
    pomodoroTargetEndRef.current = null;
    setPomodoroStage('focus');
    setPomodoroRemaining(FOCUS_TIME);
  };

  // Encerrar sessao completa (Livre + Pomodoro)
  const endSession = () => {
    setFreeElapsed(0);
    lastFreeTickRef.current = Date.now();
    setIsFreeRunning(true);
    resetPomodoro();
    setPomodorosCompletedToday(0);
    setPomodoroCycleCount(0);
    try {
      localStorage.removeItem(FREE_STORAGE_KEY);
      localStorage.removeItem(POMODORO_STORAGE_KEY);
      localStorage.removeItem('session_start_timestamp');
    } catch {}
  };

  const value = {
    timerMode,
    setTimerMode: changeTimerMode,
    // Free timer
    freeElapsed,
    isFreeRunning,
    pauseFreeTimer,
    resumeFreeTimer,
    resetFreeTimer,
    // Pomodoro timer
    pomodoroStage,
    pomodoroRemaining,
    isPomodoroRunning,
    pomodorosCompletedToday,
    pomodoroCycleCount,
    startPomodoro,
    pausePomodoro,
    skipPomodoroStage,
    resetPomodoro,
    // Global
    endSession,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer deve ser usado dentro de um TimerProvider');
  }
  return context;
};
