# Plano de Execução: Melhoria na Aba de Questões

## Visão Geral Arquitetural
Esta feature envolve modificações no modelo de dados, no serviço de inteligência artificial e no gerenciamento de estado do frontend.

### 1. Backend (Banco de Dados e Schemas)
A tabela de questões passará a armazenar as explicações de forma nativa.
- **`app/models.py`**: Adicionar `explanation = Column(JSON, nullable=True)` ao modelo `Question`.
- **`app/schemas.py`**: Adicionar `explanation: Optional[Dict[str, str]] = None` aos schemas correspondentes.
- **Reset do Banco**: Criaremos um script descartável (`reset_db.py`) para dropar as tabelas e recriá-las limpas, evitando falhas com questões legadas que não possuíam o novo campo de explicação.

### 2. Backend (Integração Gemini)
- **`app/services/gemini.py`**: O prompt do LLM precisará ser modificado para exigir explicitamente a chave `explanation` no JSON retornado. O prompt instruirá a IA a justificar cada alternativa (A, B, C, D, E) de maneira concisa e didática.

### 3. Frontend (Gerenciamento de Estado)
- **`QuestionsContext.jsx`**: O estado atual, que mantém apenas as respostas da *questão visível*, deve ser expandido. O contexto passará a manter um dicionário `answers` (indexado pelo índice da questão) contendo `{ selectedOption, showResult }`. Isso permite navegar livremente preservando o histórico da sessão e sincronizando com o `sessionStorage`.
- Precisamos implementar funções para:
  - Navegar para a questão anterior (`handlePrevious`).
  - Navegar para um índice específico (`jumpToIndex`).

### 4. Frontend (UI - QuestionsTab)
- **`QuestionsTab.jsx`**:
  - **Paginação e Navegação**: Rodapé contendo botões "Anterior" e "Próxima". Entre os botões, uma barra de números. Os números deverão exibir cores condicionalmente (verde para acertos, vermelho para erros) baseados no dicionário `answers` do contexto.
  - **Bloco de Explicação**: Ao exibir o resultado (`showResult == true`), renderizar um novo card abaixo das alternativas. Este card utilizará os dados de `question.explanation` para informar o porquê da alternativa selecionada estar incorreta e o porquê da resposta oficial estar correta.
