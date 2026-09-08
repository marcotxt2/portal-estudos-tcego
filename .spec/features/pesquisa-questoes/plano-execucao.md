# Plano de Execucao: Pesquisas e Filtros de Questoes por Materia e Conteudo

## Visao Geral

A feature introduz uma tabela de dominio `contents` no banco, enriquece o pipeline de extracao do Gemini para classificar questoes novas nessa taxonomia, expoe endpoints de busca filtrada no backend e cria duas entradas de UI: o painel de filtros no dashboard existente e uma nova pagina "Banco de Questoes". A Revisao Reversa tambem passa a respeitar os filtros ativos.

---

## Modelo de Dados

### Tabela nova: `contents`

```sql
CREATE TABLE IF NOT EXISTS contents (
    id SERIAL PRIMARY KEY,
    materia VARCHAR(255) NOT NULL,
    topico   VARCHAR(255) NOT NULL,
    UNIQUE(materia, topico)
);
```

Sera pre-populada com todos os topicos do edital (ver seed abaixo). A chave de dominio e o par `(materia, topico)`.

### Alteracao em `questions`

```sql
ALTER TABLE questions ADD COLUMN content_id INT REFERENCES contents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_questions_content ON questions(content_id);
```

Questoes antigas ficam com `content_id = NULL` (sem retroativo).

### Seed de conteudos do edital (Cargo B02 - TCE-GO)

| materia | topico |
|---|---|
| Engenharia de Software | Fundamentos e ciclo de vida |
| Engenharia de Software | Ageis: Scrum, Kanban, XP, Lean |
| Engenharia de Software | Requisitos e historias de usuario |
| Engenharia de Software | Arquitetura: camadas, SOA, microsservicos, eventos |
| Engenharia de Software | Principios SOLID, DRY, KISS, YAGNI |
| Engenharia de Software | UML e BPMN |
| Engenharia de Software | Design Patterns (criacionais, estruturais, comportamentais) |
| Engenharia de Software | Qualidade, testes e refatoracao |
| Desenvolvimento de Sistemas | Algoritmos, logica e estruturas de dados |
| Desenvolvimento de Sistemas | POO e programacao funcional |
| Desenvolvimento de Sistemas | Java, JavaScript, Node.js, Python |
| Desenvolvimento de Sistemas | React e desenvolvimento front-end |
| Desenvolvimento de Sistemas | APIs RESTful, GraphQL, WebSockets |
| Desenvolvimento de Sistemas | Autenticacao: OAuth 2.0, OIDC, JWT |
| Desenvolvimento de Sistemas | HTML5, CSS3, TypeScript |
| Desenvolvimento de Sistemas | Git e documentacao de APIs |
| IA Assistida e Sistemas Agentivos | LLMs e programacao baseada em intencao |
| IA Assistida e Sistemas Agentivos | Engenharia de prompts e de contexto |
| IA Assistida e Sistemas Agentivos | Ciclo agentivo e ferramentas (Claude Code, AGY CLI) |
| IA Assistida e Sistemas Agentivos | RAG e bancos vetoriais |
| IA Assistida e Sistemas Agentivos | MCP e extensibilidade (skills/tool use) |
| IA Assistida e Sistemas Agentivos | Avaliacao de codigo IA, etica e privacidade |
| DevOps e Entrega | CI/CD e pipelines de automacao |
| DevOps e Entrega | Infraestrutura como codigo e configuracao |
| DevOps e Entrega | Observabilidade: metricas, logs, traces |
| DevOps e Entrega | Git Flow, trunk-based, pull requests |
| DevOps e Entrega | Docker, Docker Compose e Kubernetes |
| DevOps e Entrega | GitHub Actions, GitLab CI/CD, Jenkins |
| Banco de Dados | Modelagem ER, normalizacao e desnormalizacao |
| Banco de Dados | SQL, algebra relacional e transacoes ACID |
| Banco de Dados | Indices e otimizacao de consultas |
| Banco de Dados | Procedures, triggers e views |
| Banco de Dados | PostgreSQL e Oracle: administracao |
| Banco de Dados | NoSQL: documentos, chave-valor, wide-column, grafos |
| Banco de Dados | Bancos vetoriais e embeddings |
| Banco de Dados | Replicacao, backup, HA e governanca |
| IA, Ciencia de Dados e Automacao | Aprendizado de maquina: supervisionado, nao supervisionado, reforco |
| IA, Ciencia de Dados e Automacao | Redes neurais e deep learning |
| IA, Ciencia de Dados e Automacao | PLN e IA generativa |
| IA, Ciencia de Dados e Automacao | Agentes inteligentes e modelos multimodais |
| IA, Ciencia de Dados e Automacao | Ciencia de dados e Big Data |
| IA, Ciencia de Dados e Automacao | Etica em IA, LGPD e Estrategia Brasileira de IA |
| Seguranca da Informacao | Principios CIA, autenticidade e nao repudio |
| Seguranca da Informacao | Gestao de riscos, vulnerabilidades e incidentes |
| Seguranca da Informacao | Controle de acesso e IAM |
| Seguranca da Informacao | Criptografia simetrica, assimetrica e PKI |
| Seguranca da Informacao | OWASP Top 10:2025 e DevSecOps |
| Seguranca da Informacao | Backup, continuidade e recuperacao de desastres |
| Seguranca da Informacao | Malware, phishing, firewalls, IDS/IPS, Zero Trust |
| Seguranca da Informacao | ISO/IEC 27000 |
| Sistemas Operacionais, Redes e Nuvem | Administracao Windows e Linux |
| Sistemas Operacionais, Redes e Nuvem | Shell scripting (Linux e PowerShell) |
| Sistemas Operacionais, Redes e Nuvem | Active Directory e LDAP |
| Sistemas Operacionais, Redes e Nuvem | TCP/IP, IPv4, IPv6, DNS, DHCP |
| Sistemas Operacionais, Redes e Nuvem | Protocolos: HTTP/2, HTTP/3, HTTPS, SMTP, FTP, SSH |
| Sistemas Operacionais, Redes e Nuvem | VPN, balanceamento de carga, proxies, firewalls, Wi-Fi |
| Sistemas Operacionais, Redes e Nuvem | Nuvem: IaaS, PaaS, SaaS, serverless, escalabilidade |
| Governanca de TI | COBIT 2019, ITIL v4, ISO/IEC 38500:2024 |
| Governanca de TI | Gestao de servicos: incidentes, problemas, mudancas |
| Governanca de TI | Gestao de projetos: PMBOK 8a ed. e metodos ageis |
| Governanca de TI | Contratacoes TIC (Lei 14.133/2021) |
| Governanca de TI | Governo digital: Lei 14.129/2021 e ENGD 2024-2027 |
| Legislacao e Normativos | LGPD (Lei 13.709/2018): privacy by design, minimizacao, anonimizacao |
| Legislacao e Normativos | Marco Civil da Internet (Lei 12.965/2014) |
| Legislacao e Normativos | Certificacao digital |
| Legislacao e Normativos | LC estadual 205/2025 |
| Legislacao e Normativos | Normativos TCE-GO: RN 13/2016, RA 14/2024, RA 17/2024, RA 14/2025, PDTI 2025-2026 |
| Lingua Inglesa | Compreensao de textos tecnicos em ingles |
| Lingua Inglesa | Vocabulario tecnico de TI |

---

## Backend (FastAPI / SQLAlchemy)

### `db/migrations/add_contents.sql` [NOVO]

Script SQL com o `CREATE TABLE contents`, o `ALTER TABLE questions ADD COLUMN content_id`, os indices e o `INSERT` completo de todos os topicos do edital. Sera executado manualmente (ou via entrypoint Docker) uma unica vez.

### `backend/app/models.py` [MODIFICAR]

Adicionar o modelo ORM `Content`:

```python
class Content(Base):
    __tablename__ = "contents"
    id      = Column(Integer, primary_key=True, index=True)
    materia = Column(String(255), nullable=False)
    topico  = Column(String(255), nullable=False)
    __table_args__ = (UniqueConstraint("materia", "topico"),)
```

Adicionar `content_id` na model `Question`:

```python
content_id = Column(Integer, ForeignKey("contents.id", ondelete="SET NULL"), nullable=True)
```

### `backend/app/schemas.py` [MODIFICAR]

- Adicionar `ContentResponse(id, materia, topico)`.
- Adicionar `content_id: Optional[int]` em `QuestionResponse`.

### `backend/app/routers/questions.py` [NOVO]

Novo router expondo:

| Metodo | Rota | Descricao |
|---|---|---|
| `GET` | `/questions/` | Lista paginada com filtros opcionais: `materia`, `content_ids` (lista), `q` (full-text), `apenas_erros` (bool) |
| `GET` | `/questions/contents` | Retorna todos os pares `(materia, topico)` da tabela `contents` para popular os selects |

**Logica de busca em `/questions/`:**
1. Base query em `questions`.
2. Se `materia`: join com `contents`, filtra `contents.materia = materia`.
3. Se `content_ids`: `questions.content_id IN (content_ids)`.
4. Se `q`: `questions.statement ILIKE '%q%' OR questions.options::text ILIKE '%q%'` (PostgreSQL full-text simples via ILIKE; suficiente para o volume esperado).
5. Se `apenas_erros=True`: subquery em `user_progress` filtrando `is_correct = False`, exige `question_id IN`.
6. Retorna lista de `QuestionResponse`.

### `backend/app/routers/session.py` [MODIFICAR]

Endpoint `GET /session/review` recebe parametros opcionais `materia: str | None` e `content_ids: list[int] | None`. Quando presentes, a query de `wrong_answers` e filtrada pelo `content_id` das questoes.

### `backend/app/services/extractor.py` [MODIFICAR]

- Adicionar `content_id: int | None = None` ao schema Pydantic `QuestionExtracted`.
- Adicionar `materia: str | None` e `topico: str | None` ao schema Pydantic `QuestionExtracted`.
- Atualizar o `prompt` para instruir o Gemini a classificar cada questao com `materia` e `topico` **usando estritamente os valores da lista do edital** (injetados no prompt como JSON fixo).
- Em `process_pdf_background`, apos extrair, fazer lookup na tabela `contents` pelo par `(materia, topico)` para obter o `content_id` real e gravar na `Question`.

### `backend/app/main.py` [MODIFICAR]

Registrar o novo `questions.router` com prefixo `/api/questions`.

---

## Frontend (React / Vite)

### `frontend/src/api.js` [MODIFICAR]

Adicionar:
- `fetchContents()` -> `GET /api/questions/contents` (retorna lista de contents para popular filtros)
- `fetchFilteredQuestions(params)` -> `GET /api/questions/` com querystring dinamica
- `fetchReview(params)` -> `GET /api/session/review` com `materia` e `content_ids` opcionais

### `frontend/src/components/FilterPanel.jsx` [NOVO]

Componente controlado recebendo props `materia`, `contentIds`, `searchQuery`, `apenasErros`, `onFilterChange`. Renderiza:
- Select de "Materia" (opcoes unicas derivadas dos `contents`)
- Multiselect de "Conteudo" dependente da materia selecionada
- Input de busca textual
- Checkbox "Apenas erros"
- Botao "Aplicar" e "Limpar"

### `frontend/src/components/BancoQuestoes.jsx` [NOVO]

Nova pagina/aba "Banco de Questoes":
- Renderiza `FilterPanel` no topo
- Ao aplicar filtros, chama `fetchFilteredQuestions(params)`
- Lista as questoes resultantes em cards (enunciado, opcoes colapsadas, badge de materia/topico)
- Ao clicar em uma questao, abre o modo de resolucao inline (mesmo visual do `QuestionsTab`)

### `frontend/src/components/QuestionsTab.jsx` [MODIFICAR]

- Adicionar botao "Filtrar" acima da lista de questoes
- Ao clicar, exibe o `FilterPanel` como drawer/modal lateral
- Ao aplicar: substitui a lista de questoes pelo resultado de `fetchFilteredQuestions(params)` com `apenas_erros=false`
- Badge de `materia`/`topico` exibido no card da questao quando `content_id` presente

### `frontend/src/components/ReviewTab.jsx` [MODIFICAR]

- Adicionar `FilterPanel` no topo da aba de Revisao Reversa
- Ao aplicar filtros: chama `fetchReview({ materia, content_ids })` em vez do fetch fixo
- O componente ja re-renderiza a lista filtrada (AC-032)

### `frontend/src/App.jsx` [MODIFICAR]

- Adicionar a tab "Banco de Questoes" ao array `tabs`
- Renderizar `<BancoQuestoes />` quando `activeTab === 'banco'`

---

## Fluxo Completo (Zero Pontas Soltas)

```
PDF novo -> UploadTab -> extractor.py
  -> Gemini classifica (materia, topico)
  -> lookup em contents -> content_id
  -> Question salva com content_id

Estudante -> BancoQuestoes ou QuestionsTab (botao Filtrar)
  -> FilterPanel -> fetchFilteredQuestions()
  -> GET /api/questions/?materia=X&content_ids=1,2&q=texto&apenas_erros=false
  -> backend filtra e retorna
  -> QuestionsTab renderiza sessao avulsa

Estudante -> ReviewTab
  -> FilterPanel -> fetchReview({ materia, content_ids })
  -> GET /api/session/review?materia=X&content_ids=1,2
  -> backend filtra wrong_answers com join em questions.content_id
  -> ReviewTab renderiza revisao reversa filtrada (AC-032)
```
