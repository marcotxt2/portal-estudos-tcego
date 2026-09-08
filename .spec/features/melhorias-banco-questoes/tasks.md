# tasks.md - melhorias-banco-questoes

#### [concluida] T-044 - App.jsx: remover sidebar, sessoes e restruturar abas
- Refs: AC-033, AC-034
- Arquivos: frontend/src/App.jsx
- Esforco: medio
- Remover os states `modules`, `activeModule`, os useEffects de `fetchModules` / `fetchDailySession` / `fetchSessionByModule`. Remover o bloco `<aside>` de Materias. Remover a aba "Questoes" da lista de tabs. Mudar `activeTab` inicial para `'banco'`. Ajustar o `<main>` para layout de coluna única (remover `md:flex-row gap-8`).

#### [concluida] T-045 - api.js: remover funcoes de sessao obsoletas
- Refs: AC-033
- Arquivos: frontend/src/api.js
- Esforco: baixo
- Remover as exportacoes `fetchDailySession`, `fetchSessionByModule` e `fetchModules` do arquivo. Nao remover `fetchContents`, `fetchFilteredQuestions` e `fetchReview`.

#### [concluida] T-046 - Correcao de contraste do select no Dark Mode
- Refs: AC-035
- Arquivos: frontend/src/index.css, frontend/src/components/FilterPanel.jsx
- Esforco: baixo
- Em `index.css`: adicionar `color-scheme: light` em `:root` e `color-scheme: dark` em `.dark`. Em `FilterPanel.jsx`: garantir que os elementos `<select>` e `<option>` possuam `backgroundColor` e `color` com valores concretos das CSS vars, sem transparencia.

#### [concluida] T-047 - Ajuste dos testes para o novo fluxo sem sessoes
- Refs: AC-033, AC-034
- Arquivos: frontend/test/App.test.jsx
- Esforco: medio
- Refatorar o `App.test.jsx` para remover os mocks de `fetchDailySession`, `fetchSessionByModule` e `fetchModules`. Adaptar o teste de refetch pos-upload (agora sem modulo na sidebar). Garantir que todos os testes passem com Exit Code 0.
