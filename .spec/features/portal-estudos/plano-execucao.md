# Plano de Execução e Arquitetura: Portal de Estudos Pessoal

Este documento detalha o design técnico para a implementação das Histórias de Usuário e Critérios de Aceite definidos na especificação.

## 1. Stack Tecnológico Base
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2.
- **Banco de Dados:** PostgreSQL 16 (via Docker).
- **Frontend:** React 18, Vite, Tailwind CSS v3, Axios.
- **Extrator:** Python, `pdfplumber` ou `pypdf`, `google-genai` (SDK nativo Gemini), `psycopg2-binary`.

## 2. Modelagem de Dados (SQLAlchemy)

Mapeando a regra "se sai, tem que entrar":
- **`Module`**: Representa uma disciplina do edital (Ex: "Engenharia de Software"). Contém o `day_of_week` (0 a 6).
- **`Theory`**: Trechos de texto formatados em Markdown. Referencia `module_id`.
- **`Question`**: Cada questão lida do PDF. Possui JSON estruturado de alternativas (`{"A": "...", "B": "..."}`), gabarito correto e FK para um `Theory` (se o Gemini conseguir associar diretamente) ou texto justificador.
- **`UserProgress`**: Guarda cada resposta feita no app (id, question_id, escolhida, is_correct, timestamp).

## 3. Pipeline de Ingestão de Dados (O Extrator)

O componente `extractor/pdf_to_db.py`:
1. Mapeia os diretórios em `input_pdfs/` para criar os registros de `Module` no banco.
2. Itera pelos PDFs de cada pasta. Extrai os blocos de texto nativo.
3. Envia o texto em chunks para a API do Gemini. Utilizará o parâmetro `response_schema` com Pydantic para forçar o retorno estruturado de um JSON contendo `theory_blocks` e `questions`.
4. Trata erros com lógica de *Exponential Backoff* (retentativas) caso exceda limites da cota gratuita da API.
5. Persiste as teorias e questões extraídas no PostgreSQL vinculando-as ao Módulo correto.

## 4. Lógica de Backend (FastAPI)

Três domínios principais roteados:
- **`GET /api/session/daily`**: 
  - Determina o dia atual do sistema.
  - Busca o módulo correspondente.
  - Seleciona **teorias** do módulo.
  - Seleciona **questões**, ordenando primeiro as que o usuário possui erro no `user_progress` (Spaced Repetition focado em falhas), limitando um pool diário.
- **`POST /api/answers`**:
  - Endpoint "fire-and-forget". O frontend bate aqui para gravar o `UserProgress`. Não precisa de validação complexa.
- **`GET /api/session/review`**:
  - Cruza `UserProgress` (erros recentes) com `Question` e `Theory` para prover a aba de "Correção Reversa".

## 5. Arquitetura Frontend (React + Tailwind AMOLED)

- **Design System**: True Black. O CSS utilizará base `@tailwind base`, e no root `body { background-color: #000000; color: #ffffff; }`. Superfícies de cards usarão `#121212`.
- **State Management**: React `useState`/`useEffect` tradicionais são suficientes para este app single-user de sessão rápida.
- **UX de Questões**: Renderização isolada (uma questão por vez). Ao clicar no botão da alternativa (ex: `A`), o estado local de índice avança imediatamente (`setIndex(i+1)`) enquanto o `fetch` de submissão ocorre solto (sem `await` bloqueante).
- **Cronômetro**: Um componente `Header` isolado com um `setInterval` que atualiza uma barra de progresso (0 a 150 minutos).
