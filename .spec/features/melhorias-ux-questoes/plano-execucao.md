# Plano de Execução Técnica: Melhorias UX - Questões

Este documento detalha o planejamento arquitetural para a implementação da especificação `melhorias-ux-questoes`.

## 1. Preto AMOLED (Baixo Esforço)
- **Frontend CSS**: Alteração da variável `--color-bg` na classe `.dark` dentro de `index.css` de `#09090b` para `#000000`. 
- **Cards e Superfícies**: O sistema já usa `--color-surface` (`#111113`), que garantirá a hierarquia visual. Nenhuma alteração extra necessária.

## 2. Explicação na Revisão Reversa (Médio Esforço)
- **Frontend Component**: O componente `ReviewTab.jsx` renderiza a lista de questões. Para cada item na iteração, precisamos gerenciar um estado local de toggle (`expandedExplanations`).
- **UI**: Inserir um botão com ícone abaixo da div de gabarito. Quando ativo, exibe o conteúdo de `item.question.explanation` no mesmo padrão visual do `QuestionViewer.jsx`.
- **Condicional**: O botão só é renderizado se `item.question.explanation` for *truthy*.

## 3. Filtro "Não mostrar questões já respondidas" (Médio Esforço)
- **Backend Router**: Em `routers/questions.py`, na rota de listagem, adicionar o parâmetro booleano opcional `nao_respondidas`.
- **Backend Lógica**: Se `nao_respondidas` for verdadeiro, fazer uma subquery na tabela `UserProgress` (filtrando pelo `user_id` do usuário logado) e excluir essas `question_id` do retorno principal usando `Question.id.not_in(...)`.
- **Frontend Componentes**: 
  - Adicionar novo estado e toggle no `FilterPanel.jsx`.
  - Passar esse estado pelo `QuestionsTab.jsx` para a função `fetchFilteredQuestions` em `api.js`.
  - Modificar `QuestionsTab.jsx` para interceptar o estado vazio (`questions.length === 0` e `naoRespondidas === true`) e exibir a mensagem de "Parabéns!" com o botão de limpar filtros.

## 4. Perfis de Usuário com JWT (Alto Esforço)
- **Database Migrations**: 
  - Script SQL para criar a tabela `users` (id, username, password_hash, created_at).
  - Script SQL para adicionar a coluna `user_id` em `user_progress`, criar um usuário padrão (`marco`) e fazer o update dos registros existentes para esse `user_id`. Depois adicionar a *foreign key constraint* e tornar a coluna não nula se possível.
- **Backend Schema & Models**:
  - `models.py`: Criar classe `User`. Adicionar `user_id` em `UserProgress`.
  - `schemas.py`: Criar `Token`, `UserCreate`, `UserResponse`.
- **Backend Auth & Endpoints**:
  - Criar um utils/security (`auth.py`) com JWT encode/decode e setup do `bcrypt` usando `passlib`.
  - Criar um novo router `auth.py` com a rota `POST /login`.
  - Criar uma dependência `get_current_user` para proteger as rotas que acessam ou modificam progresso (`answers.py`, `questions.py`, `session.py`).
- **Script CLI**: 
  - `create_user.py` na raiz do backend que recebe argumentos via `sys.argv` e insere o usuário usando `SessionLocal`.
- **Frontend Auth State**:
  - Criar o arquivo `context/AuthContext.jsx` para prover o estado `user` e a função `login`/`logout`.
  - Modificar `App.jsx` ou o entry point para renderizar o `Login.jsx` caso o usuário não esteja autenticado.
- **Frontend API**: 
  - Ajustar o fetch wrapper ou `api.js` para incluir o header `Authorization: Bearer {token}` do `localStorage` em todas as requisições. Lidar com respostas `401 Unauthorized` forçando o logout.
