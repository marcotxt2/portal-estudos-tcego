# Plano de Execução - Persistência de Estado no Frontend

Este documento traduz a especificação da feature de persistência de estado em um roadmap de arquitetura.

## Arquitetura de Estados e Contextos (Context API)

Para evitar prop-drilling e renderizações excessivas no `App.jsx`, adotaremos o uso de **Context API** no React. Duas entidades principais terão seus estados globais extraídos para contextos independentes.

### 1. UploadContext (`src/context/UploadContext.jsx`)
- **Estado**: `uploadQueue` (array de objetos com os metadados dos uploads) e `intervalsRef` (para controle de polling em memória).
- **Lógica Centralizada**: Funções como `handleFiles`, `updateItem`, `startPolling` e `handleDismiss` serão transferidas do `UploadTab.jsx` para o contexto.
- **Persistência F5**:
  - Ao iniciar um upload, as tarefas que possuírem `taskId` do backend terão seus IDs salvos em um array no `localStorage` (ex: `pending_upload_tasks`).
  - No `useEffect` inicial do Contexto, o sistema tentará ler os taskIds salvos e reiniciará o polling se eles ainda estiverem processando (status pending/processing), recuperando assim a barra de progresso visualmente.
  - Arquivos ainda na fase local `uploading` (Blob File) sem taskId não são persistíveis e serão sumariamente descartados no F5.

### 2. QuestionsContext (`src/context/QuestionsContext.jsx`)
- **Estado**: `currentIndex` (int), `selectedOption` (string|null), `showResult` (boolean).
- **Lógica Centralizada**: Funções como `handleOptionClick`, `handleConfirm` e `handleNext` podem continuar parte no Contexto, parte no Tab. O importante é o armazenamento do estado.
- **Persistência F5**:
  - Toda vez que `currentIndex`, `selectedOption` ou `showResult` mudarem, o contexto salvará o objeto serializado no `sessionStorage` (ex: `questions_progress`).
  - No `useEffect` inicial (mount), ele restaura essas chaves para que a tela renderize imediatamente o estado em que o usuário parou, com o gabarito travado na tela conforme decidido.

### 3. Modificações em Componentes Visuais
- **App.jsx**: Apenas importará os dois Providers e envolverá a `<main>`.
- **UploadTab.jsx**: Virará um componente de apresentação ("dumb component"), consumindo o `useUpload()` para disparar eventos e desenhar as barras.
- **QuestionsTab.jsx**: Consumirá o `useQuestions()` para renderizar a questão atual e os estilos de respostas.

### 4. Testes (TDD)
A introdução dos Contextos quebra os testes unitários atuais porque os componentes tentarão consumir o contexto vazio ou inexistente.
- Utilizaremos wrappers customizados (ex: `renderWithContext`) para injetar os Providers nos testes do `UploadTab.test.jsx` e `QuestionsTab.test.jsx`.
- Realizaremos `vi.spyOn` nos métodos dos Contextos ou renderizaremos com dados mockados para garantir o Exit 0.

## Estratégia de Deploy Local
Nenhum banco de dados ou backend precisará de alteração (Zero mudanças no Python/FastAPI). O impacto é puramente na SPA (Frontend).
