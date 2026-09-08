// @spec:AC-012 @spec:AC-017
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

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

const SESSION_KEY = 'session_start_timestamp';

function isSameDay(ts) {
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function getOrCreateSessionStart() {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    const ts = parseInt(stored, 10);
    if (!isNaN(ts) && isSameDay(ts)) return ts;
  }
  const now = Date.now();
  localStorage.setItem(SESSION_KEY, String(now));
  return now;
}

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null); // @spec: useRef para interval, nao useState

  const startTimer = () => {
    const sessionStart = getOrCreateSessionStart();
    setElapsed(Math.floor((Date.now() - sessionStart) / 1000));

    intervalRef.current = setInterval(() => {
      const start = parseInt(localStorage.getItem(SESSION_KEY) || '0', 10);
      const now = Date.now();
      // Detecta virada de dia
      if (!isSameDay(start)) {
        const newStart = Date.now();
        localStorage.setItem(SESSION_KEY, String(newStart));
        setElapsed(0);
        return;
      }
      setElapsed(Math.floor((now - start) / 1000));
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleEndSession = () => {
    clearInterval(intervalRef.current);
    localStorage.removeItem(SESSION_KEY);
    setElapsed(0);
    startTimer();
  };

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderColor: 'var(--color-border)',
        maxHeight: '56px',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logotipo */}
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          Portal TCE-GO
        </span>

        {/* Controles direita */}
        <div className="flex items-center gap-4">
          {/* Relogio de sessao */}
          <span
            className="font-mono text-sm tabular-nums"
            style={{ color: 'var(--color-muted)' }}
            title="Tempo de estudo na sessao de hoje"
          >
            {formatElapsed(elapsed)}
          </span>

          {/* Botao encerrar sessao */}
          <button
            onClick={handleEndSession}
            className="text-xs cursor-pointer px-2 py-1 rounded border"
            style={{
              color: 'var(--color-muted)',
              borderColor: 'var(--color-border)',
            }}
            title="Encerrar sessao e reiniciar relogio"
          >
            Encerrar
          </button>

          {/* User Info / Logout */}
          <div className="flex items-center gap-2 border-l pl-4" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {user?.username}
            </span>
            <button
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
