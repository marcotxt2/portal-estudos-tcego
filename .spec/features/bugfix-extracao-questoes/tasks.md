# Lista de Tarefas - Correção da Extração de Questões

#### [concluida] T-001 - Alterar tipagem da tabela e schemas do Backend
- Refs: AC-027
- Arquivos: backend/app/models.py, backend/app/schemas.py
- Esforço: baixo
- Mudar tipagem da coluna `explanation` na tabela `questions` de JSON para Text/String, e nos schemas Pydantic de Dict para str.

#### [concluida] T-002 - Atualizar Extractor e Prompt do Gemini
- Refs: AC-026, AC-027
- Arquivos: backend/app/services/extractor.py
- Esforço: medio
- Atualizar a classe Pydantic `QuestionExtracted`, atualizar o texto de exemplo de JSON, e adicionar regras de blindagem no prompt para evitar que questões sejam ignoradas ou jogadas em `theories`.

#### [concluida] T-003 - Refatorar renderização da Explicação no Frontend
- Refs: AC-027
- Arquivos: frontend/src/components/QuestionsTab.jsx, frontend/test/QuestionsTab.test.jsx
- Esforço: baixo
- Trocar o `Object.entries(question.explanation).map(...)` por renderização de string simples. Atualizar testes unitários mockados.
