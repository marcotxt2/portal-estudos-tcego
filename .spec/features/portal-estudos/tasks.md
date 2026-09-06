#### [concluida] T-001 - Configurar estrutura do Backend e Database
- Refs: AC-001
- Arquivos: backend/Dockerfile, backend/requirements.txt, backend/app/main.py, backend/app/database.py
- Esforço: baixo
- Configurar base FastAPI, conexão SQLAlchemy e conteinerização via Docker.

#### [concluida] T-002 - Criar Modelos e Schemas
- Refs: AC-003, AC-004
- Arquivos: backend/app/models.py, backend/app/schemas.py
- Esforço: baixo
- Mapear tabelas modules, theories, questions, user_progress no SQLAlchemy e Pydantic.

#### [concluida] T-003 - Criar script de extração (PDF to DB) via Gemini
- Refs: AC-002, AC-006
- Arquivos: extractor/requirements.txt, extractor/pdf_to_db.py
- Esforço: alto
- Implementar extração de texto via `pdfplumber`, envio segmentado à API Gemini com `response_schema` (JSON estruturado), lógica de *retry* em caso de falha da API e persistência no banco de dados vinculando o conteúdo à pasta do módulo.

#### [concluida] T-004 - Implementar Rotas e Lógica (Daily Session)
- Refs: AC-003, AC-004
- Arquivos: backend/app/routers/session.py, backend/app/routers/answers.py
- Esforço: medio
- Implementar rota GET `daily` que cruze dia da semana, módulo e histórico de erros (spaced repetition) e rota POST `answers` para inserção do progresso do usuário.

#### [concluida] T-005 - Configurar Frontend React e Tailwind
- Refs: AC-001, AC-005
- Arquivos: frontend/Dockerfile, frontend/package.json, frontend/tailwind.config.js, frontend/src/index.css
- Esforço: baixo
- Setup base do Vite, tema AMOLED True Black, configuração do servidor Nginx/dev.

#### [concluida] T-006 - Construir Interface (Header, Tabs e Flashcards)
- Refs: AC-003, AC-004, AC-005
- Arquivos: frontend/src/App.jsx, frontend/src/components/Header.jsx, frontend/src/components/TheoryTab.jsx, frontend/src/components/QuestionsTab.jsx, frontend/src/components/ReviewTab.jsx, frontend/src/api.js
- Esforço: alto
- Montar UI do dashboard, lógica do timer de 150m, aba de Teoria, aba de Questões (avanço assíncrono silencioso) e aba de Correção Reversa.
