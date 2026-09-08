/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Tokens semanticos mapeados para CSS vars (definidas em index.css)
        background: 'var(--color-bg)',
        surface:    'var(--color-surface)',
        border:     'var(--color-border)',
        primary:    '#2563eb',
        // Aliases para compatibilidade com codigo existente
        card:       'var(--color-surface)',
      },
      textColor: {
        DEFAULT:    'var(--color-text)',
        muted:      'var(--color-muted)',
      },
      borderColor: {
        DEFAULT:    'var(--color-border)',
        subtle:     'var(--color-border)',
      },
    },
  },
  plugins: [],
}

