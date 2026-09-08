# plano-execucao.md — Fim das Sessões e Foco no Banco de Questões

## Decisões de Arquitetura

### Modelo Mental do Novo Fluxo
O usuário abre o app → vê o Banco de Questões como tela padrão → seleciona Matéria e Tópico(s) → clica em Aplicar → o BancoQuestoes.jsx chama `GET /api/questions/?materia=X&content_ids=Y` → exibe a pilha completa de questões daquele tópico. Fim. Não existe mais conceito de sessão diária ou por módulo.

A aba "Revisão Reversa" sobrevive: ela ainda exibe as questões que o usuário errou, usando `GET /api/session/review` com filtros opcionais.

---

### Backend

Nenhuma mudança necessária. O endpoint `/api/questions/` (criado na feature anterior) já suporta busca por `materia`, `content_ids` e `q`. O endpoint `/session/review` permanece intacto.

As rotas `/session/daily` e `/session/module/{id}` serão mantidas no backend (mas não expostas na UI) para não quebrar testes existentes nem o contrato de API.

---

### Frontend

**Mudanças no `App.jsx` (AC-033, AC-034):**
- Remover todo o state `modules`, `activeModule`, `loading` de sessão, e os `useEffect` que chamam `fetchDailySession` / `fetchSessionByModule` / `fetchModules`.
- Remover o bloco `<aside>` de Materias completamente.
- Remover a aba "Questoes" da lista de tabs; manter apenas: **Banco de Questões** (default), **Revisão Reversa**, **Upload PDF**.
- Mudar o `activeTab` inicial para `'banco'`.
- O `<main>` passa a ser apenas uma coluna (sem `flex-row gap-8`).

**Mudanças no `BancoQuestoes.jsx` (AC-034):**
- Nenhuma mudança estrutural necessária — o componente já faz a busca filtrada corretamente.
- Ajuste de estilo: remover o `max-w-4xl mx-auto px-4 py-8` do wrapper interno, pois o `App.jsx` já irá prover o container principal. O componente deve preencher o espaço disponível.

**Mudanças no `FilterPanel.jsx` e `index.css` (AC-035):**
- No `index.css`, adicionar a diretiva `color-scheme: light` em `:root` e `color-scheme: dark` em `.dark`, garantindo que os selects nativos do browser herdem o esquema correto.
- Adicionalmente, no `FilterPanel.jsx`, garantir que os `<select>` tenham `background-color` e `color` explícitos para que o dropdown nativo também respeite as variáveis CSS.

**Mudanças no `api.js`:**
- Remover `fetchDailySession`, `fetchSessionByModule` e `fetchModules`.

---

### Testes Frontend

- `App.test.jsx`: Refatorar para a nova estrutura (sem fetchModules, sem sidebar). O teste de refetch pós-upload será simplificado.
- Remover testes que mocavam `fetchDailySession` e `fetchSessionByModule`.

---

## Paralelismo de Execução

- **T-044 e T-045** podem ser executadas em paralelo (App.jsx e api.js são modificações independentes).
- **T-046** (FilterPanel + index.css) é independente das demais.
- **T-047** (testes) depende das T-044 e T-046 estarem concluídas.
