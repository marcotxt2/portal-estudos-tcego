#### [concluida] T-028 - Criar UploadContext com Persistência (Context API)
- Refs: AC-018, AC-019
- Arquivos: frontend/src/context/UploadContext.jsx
- Esforço: medio
- Criar o provedor de contexto `UploadProvider`. Extrair os estados `uploadQueue`, `intervalsRef` e os métodos `handleFiles`, `startPolling` e `updateItem` do `UploadTab.jsx` para dentro do contexto. Implementar persistência dos `taskId`s em `localStorage` no useEffect de montagem para retomar polling no recarregamento (F5).

#### [concluida] T-029 - Criar QuestionsContext com Persistência (Context API)
- Refs: AC-020
- Arquivos: frontend/src/context/QuestionsContext.jsx
- Esforço: baixo
- Criar o provedor de contexto `QuestionsProvider`. Armazenar os estados locais de progresso (`currentIndex`, `selectedOption`, `showResult`). Adicionar um `useEffect` para persistir e restaurar esses valores no `sessionStorage` sob a chave `questions_progress`.

#### [concluida] T-030 - Refatorar Componentes Visuais (UploadTab e QuestionsTab)
- Refs: AC-018, AC-020
- Arquivos: frontend/src/components/UploadTab.jsx, frontend/src/components/QuestionsTab.jsx
- Esforço: baixo
- Remover a declaração de estados locais (`useState`) de `uploadQueue` e os progressos de questões. Modificar ambos os componentes para importarem e usarem `useUpload()` e `useQuestions()`. O UploadTab deve se tornar um componente puramente visual para as filas, e o QuestionsTab puramente visual para os botões.

#### [concluida] T-031 - Integrar Contextos no App.jsx
- Refs: AC-018, AC-019, AC-020
- Arquivos: frontend/src/App.jsx
- Esforço: baixo
- Importar `UploadProvider` e `QuestionsProvider` no `App.jsx`. Envolver a estrutura principal `<main>` da página com esses provedores para garantir que a lógica sobreviva às trocas de aba realizadas dentro do `<div className="flex-1 min-w-0">`.

#### [concluida] T-032 - Atualizar Testes Automatizados TDD
- Refs: AC-021
- Arquivos: frontend/tests/UploadTab.test.jsx, frontend/tests/QuestionsTab.test.jsx, frontend/tests/App.test.jsx
- Esforço: alto
- Refatorar a suíte do Vitest para importar um custom render ou injetar os novos Providers nos testes dos componentes afetados. Garantir mocks precisos para o contexto, localStorage e sessionStorage de forma que os testes retornem Exit 0.
