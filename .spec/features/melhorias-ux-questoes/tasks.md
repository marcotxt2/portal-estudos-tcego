#### [concluida] T-001 - Preto AMOLED no index.css
- Refs: AC-058, AC-059, AC-060
- Arquivos: frontend/src/index.css
- Esforço: baixo
- Alterar `--color-bg` de `#09090b` para `#000000` na classe `.dark` do css global.

#### [concluida] T-002 - Adicionar botão de Explicação na Revisão Reversa
- Refs: AC-043, AC-044, AC-045, AC-046
- Arquivos: frontend/src/components/ReviewTab.jsx
- Esforço: medio
- Gerenciar estado `expandedExplanations`. Condicionalmente renderizar o botão "Explicação" e exibir o texto quando ativo.

#### [concluida] T-003 - Backend API: Filtro de questões já respondidas
- Refs: AC-048
- Arquivos: backend/app/routers/questions.py
- Esforço: medio
- Adicionar query param `nao_respondidas` e lógica SQLAlchemy usando `Question.id.not_in(...)` cruzando com a tabela `UserProgress`.

#### [concluida] T-004 - Frontend UI: Filtro de questões já respondidas
- Refs: AC-047, AC-049, AC-050
- Arquivos: frontend/src/components/FilterPanel.jsx, frontend/src/components/QuestionsTab.jsx, frontend/src/api.js
- Esforço: medio
- Adicionar campo no state do painel. Passar argumento na chamada de `api.js`. Tratar retorno vazio com mensagem de sucesso na aba.

#### [concluida] T-005 - Perfis: Migration de Banco e Models
- Refs: AC-051, AC-052
- Arquivos: db/migrations/add_users_table.sql, backend/app/models.py
- Esforço: alto
- Criar a migração `add_users_table.sql` para tabela `users` e `user_id` em `user_progress` (com migração de dados). Modificar `models.py` para refletir as tabelas.

#### [concluida] T-006 - Perfis: Setup Auth e JWT e CLI Admin
- Refs: AC-054, AC-057
- Arquivos: backend/app/auth.py, backend/app/routers/auth.py, backend/create_user.py, backend/requirements.txt, backend/app/main.py
- Esforço: alto
- Criar lógica JWT + bcrypt em `auth.py`. Adicionar biblioteca `passlib` e `python-jose`. Criar endpoint `POST /api/login`. Incluir o script CLI para criar usuário. Configurar router em `main.py`.

#### [concluida] T-007 - Perfis: Proteger Rotas e Atualizar API
- Refs: AC-048, AC-056
- Arquivos: backend/app/routers/answers.py, backend/app/routers/questions.py, backend/app/routers/session.py
- Esforço: medio
- Adicionar `Depends(get_current_user)` nas rotas. Passar o `user_id` correto para `UserProgress` nos submits. Filtrar as perguntas `nao_respondidas` pelo usuário correto e as sessões de revisão pelo usuário logado.

#### [concluida] T-008 - Perfis: Frontend Login e Auth Context
- Refs: AC-053, AC-055
- Arquivos: frontend/src/context/AuthContext.jsx, frontend/src/components/Login.jsx, frontend/src/App.jsx, frontend/src/api.js, frontend/src/components/Header.jsx
- Esforço: xalto
- Criar AuthContext para salvar o JWT. Proteger o App exibindo `Login.jsx` se não houver user. Injetar `Authorization: Bearer` nas chamadas do `api.js` interceptando 401. Adicionar o botão "Sair" e avatar do usuário no Header.
