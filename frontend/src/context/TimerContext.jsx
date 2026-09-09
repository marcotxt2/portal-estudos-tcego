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

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.2); // A5
    gain2.gain.setValueAtTime(0.15, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.6);
  } catch {
    // Web Audio nao suportado ou bloqueado no ambiente
  }
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
      return true;
    }
    return false;
  }, []);

  // Interval principal para Free Timer
  useEffect(() => {
    if (!isFreeRunning) return;

    const interval = setInterval(() => {
      const rolledOver = checkDayRollover();
      if (!rolledOver) {
        setFreeElapsed((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isFreeRunning, checkDayRollover]);

  // Interval principal para Pomodoro Timer
  useEffect(() => {
    if (!isPomodoroRunning) return;

    const interval = setInterval(() => {
      checkDayRollover();
      setPomodoroRemaining((prev) => {
        if (prev <= 1) {
          // Transicao automatica de estagio
          playNotificationChime();

          if (pomodoroStage === 'focus') {
            const newCompleted = pomodorosCompletedToday + 1;
            const newCycle = pomodoroCycleCount + 1;
            setPomodorosCompletedToday(newCompleted);
            setPomodoroCycleCount(newCycle);

            if (newCycle % CYCLES_PER_LONG_BREAK === 0) {
              setPomodoroStage('long_break');
              return LONG_BREAK_TIME;
            } else {
              setPomodoroStage('short_break');
              return SHORT_BREAK_TIME;
            }
          } else {
            setPomodoroStage('focus');
            return FOCUS_TIME;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroStage, pomodorosCompletedToday, pomodoroCycleCount, checkDayRollover]);

  // Acoes Free Timer
  const pauseFreeTimer = () => setIsFreeRunning(false);
  const resumeFreeTimer = () => setIsFreeRunning(true);
  const resetFreeTimer = () => {
    setFreeElapsed(0);
    setIsFreeRunning(true);
  };

  // Acoes Pomodoro Timer
  const startPomodoro = () => setIsPomodoroRunning(true);
  const pausePomodoro = () => setIsPomodoroRunning(false);

  const skipPomodoroStage = () => {
    if (pomodoroStage === 'focus') {
      const nextCycle = pomodoroCycleCount + 1;
      setPomodoroCycleCount(nextCycle);
      if (nextCycle % CYCLES_PER_LONG_BREAK === 0) {
        setPomodoroStage('long_break');
        setPomodoroRemaining(LONG_BREAK_TIME);
      } else {
        setPomodoroStage('short_break');
        setPomodoroRemaining(SHORT_BREAK_TIME);
      }
    } else {
      setPomodoroStage('focus');
      setPomodoroRemaining(FOCUS_TIME);
    }
  };

  const resetPomodoro = () => {
    setIsPomodoroRunning(false);
    setPomodoroStage('focus');
    setPomodoroRemaining(FOCUS_TIME);
  };

  // Encerrar sessao completa (Livre + Pomodoro)
  const endSession = () => {
    setFreeElapsed(0);
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
