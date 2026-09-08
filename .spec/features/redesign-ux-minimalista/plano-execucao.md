# Plano de Execucao: redesign-ux-minimalista

## Design System (uiux-designer output)

Baseado nas buscas do uiux-designer, o sistema de design adotado e:

**Estilo:** Dark Mode OLED + Flat Design  
**Tipografia:** Inter (unica familia, todos os pesos) - "Spatial Clear" pairing - otimizado para legibilidade em fundos dinamicos  
**Paleta dark:** background #09090b, superficie #111113, borda #27272a, texto #fafafa, muted #71717a  
**Paleta light:** background #ffffff, superficie #f4f4f5, borda #e4e4e7, texto #09090b, muted #71717a  
**Destaque:** #2563eb (azul unico, sem gradientes)  
**Transicoes:** 150ms ease (conforme guideline "duration-timing")  
**Icones:** SVG inline Lucide (sem emojis - violacao encontrada em QuestionsTab linha 58)  
**Fonte de referencia:** Resend.com - layout centrado, esparso, monocromatico

---

## Arquitetura Tecnica

### Frontend (React + Vite + Tailwind)

#### 1. Design System Global

**tailwind.config.js** - Adicionar darkMode: 'class', cores semanticas dark/light como tokens CSS:
- Remover hardcoded `background: #000000` e `card: #121212`
- Adicionar tokens: `bg-surface`, `border-subtle`, `text-muted`, `text-primary`
- Configurar fontFamily Inter

**index.css** - Import Google Fonts Inter + variaveis CSS:
```
:root (light): --bg: #ffffff, --surface: #f4f4f5, --border: #e4e4e7, ...
.dark (dark): --bg: #09090b, --surface: #111113, --border: #27272a, ...
```

#### 2. Contexto de Tema (ThemeContext)

Novo arquivo `src/context/ThemeContext.jsx`:
- `useTheme()` hook exportado
- Estado `theme` ('dark' | 'light') persistido em `localStorage` (chave: `theme_preference`)
- Aplica/remove classe `dark` no `document.documentElement`
- Inicializa com `localStorage` ou `prefers-color-scheme`

#### 3. Header.jsx - Reescrita completa

Comportamento atual: countdown regressivo de 9000s, reseta no F5, sem toggle.
Comportamento novo:
- Relogio progressivo (tempo decorrido) usando `localStorage` (chave: `session_start_timestamp`)
- Ao iniciar: le o timestamp. Se for do dia atual (mesmo dia calendario), retoma. Caso contrario, cria novo.
- Logica de reset: botao "Encerrar sessao" limpa `localStorage` e reseta + virada de dia detectada no mount
- Toggle de tema (icone sol/lua SVG Lucide) usando `useTheme()`
- `useRef` para o `intervalId` (nao `useState` - conforme guideline React)

#### 4. UploadTab.jsx - Refatoracao completa

**Dropzone nativa (sem biblioteca externa):**
- Events `onDragOver`, `onDragLeave`, `onDrop` no container
- Estado `isDragOver` para feedback visual de borda azul
- Input `type="file"` com `multiple` e `accept="application/pdf"`

**Fila de uploads (array de tarefas):**
- Estado `uploadQueue: Array<{ localId, fileName, taskId, status, processed_chunks, total_chunks, errorMessage }>`
- `handleFiles(files)` - processa FileList, dispara `uploadPdf()` para cada arquivo em paralelo via `Promise.allSettled`
- Cada item da fila renderiza um `UploadCard` autonomo com barra de progresso e status

**Polling centralizado:**
- `useRef` para `intervalRef` por tarefa
- Polling a cada 3s para tarefas com status `pending` ou `processing`
- Ao completar: dispara `onUploadComplete()` callback que re-fetcha modulos no App.jsx

**Barra de progresso - 4 etapas:**
- Uploading (POST em transito): barra indeterminada `animate-pulse`
- Pending: barra indeterminada com label "Preparando chunks..."
- Processing: barra determinada `(processed_chunks / total_chunks) * 100`%
- Completed: barra 100% verde
- Error: barra vermelha + mensagem mapeada (AC-015)

**Mapeamento de erros (AC-015):**
```js
function mapGeminiError(errorMessage) {
  if (!errorMessage) return 'Erro desconhecido.';
  if (/RESOURCE_EXHAUSTED|429/.test(errorMessage)) return 'Cota da IA esgotada...';
  if (/503|UNAVAILABLE/.test(errorMessage)) return 'Servico da IA temporariamente...';
  if (/vazio|corrompido/i.test(errorMessage)) return 'O arquivo PDF parece estar...';
  if (/404|nao encontrado/i.test(errorMessage)) return 'Modelo de IA configurado...';
  return `Erro inesperado: ${errorMessage.slice(0, 120)}`;
}
```

**Sidebar reativa (AC-011):**
- App.jsx expoe `refreshModules()` como callback passado ao UploadTab
- Quando qualquer tarefa da fila chega em `completed`, `refreshModules()` e chamado
- Uma unica chamada mesmo que multiplos uploads completem simultaneamente (debounce simples com flag)

#### 5. App.jsx - Refatoracao de modulos reativa

- Extrai `loadModules()` como funcao nomeada (nao inline no useEffect)
- Passa `onUploadComplete={loadModules}` para UploadTab

#### 6. Limpeza global de emojis

QuestionsTab linha 58: substituir `🤖` por SVG Lucide `<Bot />` inline

---

### Backend

Nenhuma alteracao necessaria (AC-016 confirmado).

---

## Modelo de Dados

Sem alteracoes de schema. Todos os dados ja existem em `UploadTask` (status, processed_chunks, total_chunks, error_message).

---

## Parallelismo de Execucao

As tarefas podem ser executadas em dois trilhos paralelos:

**Trilho A (Design System - sem dependencias):**
T-017 -> T-018 -> T-019

**Trilho B (Logica de Upload - independente do design):**
T-020 -> T-021

**Trilho C (App.jsx - depende de T-018 e T-021 para integrar):**
T-022

**Trilho D (Limpeza - independente):**
T-023
