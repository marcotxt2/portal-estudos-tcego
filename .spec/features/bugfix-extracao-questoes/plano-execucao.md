# Plano de Execução - Correção da Extração de Questões com Explicação

## Backend
- **`app/models.py`**:
  - O campo `explanation` na model `Question` passará de `Column(JSON)` para `Column(String)` (ou Text, para suportar textos maiores), conforme AC-027.

- **`app/schemas.py`**:
  - No schema `QuestionBase` e `QuestionCreate`, o campo `explanation` mudará de `Optional[Dict[str, str]]` para `Optional[str]`, conforme AC-027.

- **`app/services/extractor.py`**:
  - A classe Pydantic `QuestionExtracted` usada para forçar o schema do Gemini terá `explanation` alterado de `dict[str, str] | None` para `str | None`.
  - O `schema_example` será modificado de `{"A": "...", "B": "..."}` para um texto de exemplo único.
  - O prompt de extração receberá reforços ("blindagem"): textos com enunciado e alternativas DEVEM sempre ser mapeados para a seção `questions`. O prompt instruirá o modelo a usar texto corrido para justificar as alternativas (AC-027).

## Frontend
- **`src/components/QuestionsTab.jsx`**:
  - O componente renderiza a explicação das questões. Atualmente, itera sobre um dicionário. Será alterado para apenas exibir o texto em `<p>{question.explanation}</p>`.

- **`test/QuestionsTab.test.jsx`**:
  - Os mocks de teste que enviavam um dicionário para `explanation` deverão ser adaptados para enviar uma string simples, garantindo a aprovação no pipeline de testes.
