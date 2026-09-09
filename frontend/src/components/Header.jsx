// @spec:AC-012 @spec:AC-017 @spec:AC-061 @spec:AC-062 @spec:AC-063 @spec:AC-064 @spec:AC-065 @spec:AC-066
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';

// Icone Sol (Lucide)
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
);

// Icone Lua (Lucide)
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
);

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const STAGE_LABELS = {
  focus: 'Foco',
  short_break: 'Pausa Curta',
  long_break: 'Pausa Longa',
};

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const {
    timerMode,
    setTimerMode,
    freeElapsed,
    isFreeRunning,
    pauseFreeTimer,
    resumeFreeTimer,
    pomodoroStage,
    pomodoroRemaining,
    isPomodoroRunning,
    pomodorosCompletedToday,
    startPomodoro,
    pausePomodoro,
    skipPomodoroStage,
    endSession,
  } = useTimer();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderColor: 'var(--color-border)',
        minHeight: '56px',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logotipo */}
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          Portal TCE-GO
        </span>

        {/* Controles de Tempo & Modo */}
        <div className="flex items-center gap-3">
          {/* Seletor de Modo: Livre / Pomodoro */}
          <div
            className="flex items-center p-0.5 rounded border text-xs font-medium"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
          >
            <button
              type="button"
              onClick={() => setTimerMode('free')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                timerMode === 'free'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Livre
            </button>
            <button
              type="button"
              onClick={() => setTimerMode('pomodoro')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                timerMode === 'pomodoro'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Pomodoro
            </button>
          </div>

          {/* Modo Cronometro Livre */}
          {timerMode === 'free' && (
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-sm tabular-nums"
                style={{ color: 'var(--color-muted)' }}
                title="Tempo liquido de estudo na sessao de hoje"
              >
                {formatElapsed(freeElapsed)}
              </span>

              {isFreeRunning ? (
                <button
                  type="button"
                  onClick={pauseFreeTimer}
                  className="text-xs cursor-pointer px-2 py-1 rounded border hover:border-[var(--color-text)] transition-colors"
                  style={{
                    color: 'var(--color-muted)',
                    borderColor: 'var(--color-border)',
                  }}
                  title="Pausar cronometro"
                >
                  Pausar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeFreeTimer}
                  className="text-xs cursor-pointer px-2 py-1 rounded border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                  title="Retomar cronometro"
                >
                  Retomar
                </button>
              )}
            </div>
          )}

          {/* Modo Pomodoro */}
          {timerMode === 'pomodoro' && (
            <div className="flex items-center gap-2">
              {/* Badge da etapa */}
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded border"
                style={{
                  backgroundColor:
                    pomodoroStage === 'focus'
                      ? 'rgba(37, 99, 235, 0.1)'
                      : pomodoroStage === 'short_break'
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(168, 85, 247, 0.1)',
                  color:
                    pomodoroStage === 'focus'
                      ? '#2563eb'
                      : pomodoroStage === 'short_break'
                      ? '#10b981'
                      : '#a855f7',
                  borderColor:
                    pomodoroStage === 'focus'
                      ? 'rgba(37, 99, 235, 0.3)'
                      : pomodoroStage === 'short_break'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(168, 85, 247, 0.3)',
                }}
              >
                {STAGE_LABELS[pomodoroStage]}
              </span>

              {/* Countdown */}
              <span
                className="font-mono text-sm font-semibold tabular-nums"
                style={{ color: 'var(--color-text)' }}
                title="Tempo restante no bloco Pomodoro"
              >
                {formatCountdown(pomodoroRemaining)}
              </span>

              {/* Botao Iniciar / Pausar Pomodoro */}
              {isPomodoroRunning ? (
                <button
                  type="button"
                  onClick={pausePomodoro}
                  className="text-xs cursor-pointer px-2 py-1 rounded border hover:border-[var(--color-text)] transition-colors"
                  style={{
                    color: 'var(--color-muted)',
                    borderColor: 'var(--color-border)',
                  }}
                  title="Pausar contagem Pomodoro"
                >
                  Pausar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startPomodoro}
                  className="text-xs cursor-pointer px-2 py-1 rounded border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                  title="Iniciar contagem Pomodoro"
                >
                  Iniciar
                </button>
              )}

              {/* Botao Pular Etapa */}
              <button
                type="button"
                onClick={skipPomodoroStage}
                className="text-xs cursor-pointer px-2 py-1 rounded border hover:border-[var(--color-text)] transition-colors"
                style={{
                  color: 'var(--color-muted)',
                  borderColor: 'var(--color-border)',
                }}
                title="Pular para o proximo bloco"
              >
                Pular
              </button>

              {/* Contador de concluidos */}
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-muted)',
                }}
                title="Ciclos de foco concluidos hoje"
              >
                {pomodorosCompletedToday} concluidos
              </span>
            </div>
          )}

          {/* Botao Encerrar Sessao */}
          <button
            type="button"
            onClick={endSession}
            className="text-xs cursor-pointer px-2 py-1 rounded border hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
            style={{
              color: 'var(--color-muted)',
              borderColor: 'var(--color-border)',
            }}
            title="Encerrar sessao de estudos e reiniciar contadores"
          >
            Encerrar
          </button>

          {/* User Info / Logout */}
          <div className="flex items-center gap-2 border-l pl-3" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
              {user?.username}
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-xs cursor-pointer px-2 py-1 rounded border hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
              style={{
                color: 'var(--color-muted)',
                borderColor: 'var(--color-border)',
              }}
              title="Sair da conta"
            >
              Sair
            </button>
          </div>

          {/* Toggle tema */}
          <button
            type="button"
            onClick={toggleTheme}
            className="cursor-pointer p-1.5 rounded"
            style={{ color: 'var(--color-muted)' }}
            aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
