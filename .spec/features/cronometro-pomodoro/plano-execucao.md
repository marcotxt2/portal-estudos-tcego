# Plano de Execucao Arquitetural: Cronometro com Pausa/Retomada e Pomodoro Nativo

## 1. Visao Geral da Arquitetura

A gestao de tempo do Portal de Estudos e desacoplada do ciclo de renderizacao do `Header` e elevada para um contexto global (`TimerContext`), garantindo:
1. Calculo preciso de tempo liquido decorrido (sem saltos de tempo ao pausar e retomar).
2. Gerenciamento nativo de ciclos Pomodoro com contagem regressiva, alertas sonoros e transicao automatica de estagios.
3. Persistencia de estado no `localStorage` com deteccao e reset automatico na virada da meia-noite.
4. Interface minimalista alinhada ao design system existente.

---

## 2. Modelo de Dados e Persistencia (Frontend)

### Chaves de Persistencia (`localStorage`)
- `portal_timer_mode`: `'free'` | `'pomodoro'`
- `portal_timer_free`:
  ```json
  {
    "elapsed": 1240,
    "isRunning": false,
    "lastStartTs": 1725880000000,
    "sessionDate": "2026-09-09"
  }
  ```
- `portal_timer_pomodoro`:
  ```json
  {
    "stage": "focus",
    "remaining": 1500,
    "isRunning": true,
    "lastTickTs": 1725880000000,
    "cycleCount": 1,
    "completedToday": 3,
    "sessionDate": "2026-09-09"
  }
  ```

---

## 3. Componentes e Fluxo de Execucao

### 3.1 `TimerContext.jsx`
- **Constantes**:
  - `FOCUS_TIME`: 25 * 60 (1500s)
  - `SHORT_BREAK_TIME`: 5 * 60 (300s)
  - `LONG_BREAK_TIME`: 15 * 60 (900s)
  - `CYCLES_BEFORE_LONG_BREAK`: 4
- **Web Audio API**:
  - Funcao utilitaria `playNotificationChime()` que cria sintetizador de dois tons senoidais suaves (ex: 587.33Hz e 880Hz) com envelope de ganho suave, sem requisições HTTP e sem arquivos estáticos.
- **Logica de Transicao Automatica**:
  - Quando `remaining === 0`:
    - Toca `playNotificationChime()`.
    - Se estava em `focus`: incrementa `completedToday`, incrementa `cycleCount`. Se `cycleCount % 4 === 0`, proximo estagio e `long_break` (15m); senao `short_break` (5m).
    - Se estava em `short_break` ou `long_break`: proximo estagio e `focus` (25m).
    - Inicia automaticamente o timer da nova etapa.
- **Deteccao de Virada de Dia**:
  - Compara `new Date().toISOString().slice(0, 10)` com o `sessionDate`.
  - Se a data mudou, zera `elapsed`, zera `completedToday` e reinicia contadores.

### 3.2 `Header.jsx`
- Exibe seletor em pílula: `[Livre | Pomodoro]`.
- Modo Livre:
  - Display digital `HH:MM:SS`.
  - Botao [Pausar / Retomar].
  - Botao [Encerrar].
- Modo Pomodoro:
  - Badge de estagio: `Foco (25m)`, `Pausa Curta (5m)`, `Pausa Longa (15m)`.
  - Display digital `MM:SS`.
  - Botao [Play / Pausar].
  - Botao [Avancar].
  - Indicador de pomodoros concluidos: `N concluidos hoje`.
  - Botao [Encerrar].

---

## 4. Matriz de Rastreabilidade

| Criterio de Aceite | Componente / Arquivo Responsavel |
|---|---|
| AC-061 (Pausa/retomada no cronometro livre) | `TimerContext.jsx`, `Header.jsx` |
| AC-062 (Alternador de modo no cabecalho) | `Header.jsx`, `TimerContext.jsx` |
| AC-063 (Ciclos e temporizacao automatica Pomodoro) | `TimerContext.jsx`, `Header.jsx` |
| AC-064 (Controles manuais Play/Pause/Avancar) | `TimerContext.jsx`, `Header.jsx` |
| AC-065 (Contador diario de ciclos concluidos) | `TimerContext.jsx`, `Header.jsx` |
| AC-066 (Encerramento manual e virada de dia) | `TimerContext.jsx`, `Header.jsx` |
