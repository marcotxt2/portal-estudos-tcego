# Tarefas

#### [concluida] T-001 - Atualizar Banco de Dados e Schemas
- Refs: AC-001, ASM-001
- Arquivos: backend/app/models.py, backend/app/schemas.py, backend/db_update.py
- Esforço: medio
- Descrição técnica atômica: Adicionar coluna `is_ai_generated` (Boolean) no modelo `Question` e atualizar os schemas. Criar `db_update.py` para alterar a tabela.

#### [concluida] T-002 - Refatorar Prompt de Extração
- Refs: AC-001
- Arquivos: extractor/pdf_to_db.py, backend/app/services/extractor.py
- Esforço: medio
- Descrição técnica atômica: Modificar a classe Pydantic `QuestionExtracted` para incluir `is_ai_generated: bool`. Alterar o prompt para orientar a IA sobre os formatos `C/E` e `A-E`, além de exigir que ela infira a resposta com `is_ai_generated = true` caso não a encontre no material.

#### [concluida] T-003 - Criar Rota de Sessão Específica por Módulo
- Refs: AC-003, AC-004
- Arquivos: backend/app/routers/session.py
- Esforço: baixo
- Descrição técnica atômica: Implementar `GET /session/module/{module_id}` retornando as `theories` e `questions` daquele módulo, reusando a estrutura da rota `/daily`.

#### [concluida] T-004 - Implementar Navegação de Módulos no Frontend
- Refs: AC-002, AC-004
- Arquivos: frontend/src/App.jsx, frontend/src/api.js, frontend/src/components/QuestionsTab.jsx
- Esforço: alto
- Descrição técnica atômica: Criar `fetchSessionByModule(moduleId)` na api. Implementar lista de disciplinas na interface (Sidebar/Header). Ao clicar em uma matéria, puxar o contexto respectivo. Em `QuestionsTab.jsx`, mostrar flag indicativa se `is_ai_generated` for true.
