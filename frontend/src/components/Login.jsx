import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Credenciais inválidas');
      }

      const data = await res.json();
      login(data.access_token);
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-sm p-8 rounded-lg shadow border border-[var(--color-border)]" style={{ backgroundColor: 'var(--color-surface, #111113)' }}>
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--color-text)]">Portal TCE-GO</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              style={{
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              style={{
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
