# tasks.md - pesquisa-questoes

#### [concluida] T-033 - Migracao de banco: tabela contents e coluna content_id
- Refs: AC-030
- Arquivos: db/migrations/add_contents.sql
- Esforco: medio
- Criar script SQL com CREATE TABLE contents (id, materia, topico, UNIQUE), ALTER TABLE questions ADD COLUMN content_id INT REFERENCES contents ON DELETE SET NULL, INDEX em questions(content_id) e INSERT completo de todos os topicos do edital (63 registros mapeados no plano-execucao.md).

#### [concluida] T-034 - ORM: modelo Content e campo content_id em Question
- Refs: AC-030
- Arquivos: backend/app/models.py
- Esforco: baixo
- Adicionar classe ORM Content com UniqueConstraint(materia, topico). Adicionar content_id = Column(Integer, ForeignKey("contents.id", ondelete="SET NULL"), nullable=True) ao modelo Question.

#### [concluida] T-035 - Schemas Pydantic: ContentResponse e QuestionResponse atualizado
- Refs: AC-028, AC-030
- Arquivos: backend/app/schemas.py
- Esforco: baixo
- Adicionar ContentResponse(id, materia, topico). Adicionar content_id: Optional[int] em QuestionResponse.

#### [concluida] T-036 - Router de questoes: GET /questions/ com filtros e GET /questions/contents
- Refs: AC-028, AC-029, AC-031
- Arquivos: backend/app/routers/questions.py, backend/app/main.py
- Esforco: medio
- Criar novo router. GET /questions/ aceita query params: materia (str), content_ids (List[int]), q (str fulltext via ILIKE), apenas_erros (bool). GET /questions/contents retorna lista completa de ContentResponse para popular selects. Registrar router em main.py com prefixo /api/questions.

#### [concluida] T-037 - Endpoint review com filtros de materia e content_ids
- Refs: AC-032
- Arquivos: backend/app/routers/session.py
- Esforco: baixo
- Adicionar parametros opcionais materia: str | None e content_ids: List[int] | None ao endpoint GET /session/review. Quando presentes, fazer join com questions e filtrar por content_id antes de retornar os review_items.

#### [concluida] T-038 - Extractor: classificacao de materia/topico via Gemini
- Refs: AC-030
- Arquivos: backend/app/services/extractor.py
- Esforco: alto
- Adicionar materia: str | None e topico: str | None ao schema QuestionExtracted. Atualizar o prompt injetando a lista canonica de (materia, topico) do edital como JSON fixo, instruindo o Gemini a usar estritamente esses valores. Em process_pdf_background, apos extracao, fazer lookup na tabela contents pelo par (materia, topico) retornado; se encontrado, gravar content_id na Question.

#### [concluida] T-039 - api.js: novas funcoes de busca filtrada e contents
- Refs: AC-028, AC-029, AC-031, AC-032
- Arquivos: frontend/src/api.js
- Esforco: baixo
- Adicionar fetchContents() -> GET /api/questions/contents. Adicionar fetchFilteredQuestions(params) -> GET /api/questions/ com querystring serializada. Atualizar fetchReview(params) para aceitar materia e content_ids opcionais.

#### [concluida] T-040 - Componente FilterPanel
- Refs: AC-028, AC-031
- Arquivos: frontend/src/components/FilterPanel.jsx
- Esforco: medio
- Criar componente controlado. Props: materia, contentIds, searchQuery, apenasErros, onFilterChange. Renderizar: select de Materia (opcoes derivadas de fetchContents), multiselect de Conteudo dependente da materia, input de busca textual, checkbox apenas erros, botoes Aplicar e Limpar.

#### [concluida] T-041 - BancoQuestoes: nova pagina de sessoes avulsas
- Refs: AC-028, AC-029, AC-031
- Arquivos: frontend/src/components/BancoQuestoes.jsx, frontend/src/App.jsx
- Esforco: alto
- Criar componente BancoQuestoes com FilterPanel no topo. Ao aplicar filtros, chamar fetchFilteredQuestions e exibir lista de questoes em cards (enunciado, badge materia/topico). Ao clicar em questao, abrir resolucao inline reutilizando a logica do QuestionsTab. Adicionar aba "Banco de Questoes" em App.jsx e renderizar BancoQuestoes quando activeTab === 'banco'.

#### [concluida] T-042 - QuestionsTab: botao Filtrar e integracao com FilterPanel
- Refs: AC-028, AC-029
- Arquivos: frontend/src/components/QuestionsTab.jsx
- Esforco: medio
- Adicionar botao "Filtrar" acima da lista. Ao clicar, exibir FilterPanel como modal/drawer. Ao aplicar filtros com apenas_erros=false, chamar fetchFilteredQuestions e substituir a lista de questoes exibida. Exibir badge de materia/topico no card quando content_id estiver preenchido.

#### [concluida] T-043 - ReviewTab: botao Filtrar e chamada apilterPanel para Revisao Reversa
- Refs: AC-031, AC-032
- Arquivos: frontend/src/components/ReviewTab.jsx
- Esforco: medio
- Adicionar FilterPanel no topo da aba. Estado local de filtros (materia, content_ids). Ao montar e ao aplicar filtros, chamar fetchReview({ materia, content_ids }) em vez do fetch fixo. Lista re-renderiza somente com os erros que atendem aos filtros.
