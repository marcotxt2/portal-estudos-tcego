# Plano de Execução: Melhoria na Extração e Exibição de Conteúdo

## Arquitetura e Fluxo de Dados

1. **Camada de Banco de Dados (Models e Schemas)**
   - O modelo `Question` (`models.py`) receberá a coluna `is_ai_generated` (Boolean) para diferenciar gabaritos reais dos inferidos pela IA.
   - Os schemas de API (`schemas.py`) também propagarão esse campo.
   - Criaremos um script (ex: `backend/db_update.py`) para rodar `ALTER TABLE questions ADD COLUMN is_ai_generated BOOLEAN DEFAULT FALSE` e evitar problemas na base atual.

2. **Camada de Extração (Gemini Prompt)**
   - O Pydantic model do extrator `QuestionExtracted` terá o campo `is_ai_generated: bool`.
   - O prompt será refinado usando a técnica de *Few-Shot* para explicar que a opção correta pode ser letras (`A,B,C,D,E`) ou Certo/Errado (`C/E`). Se a resposta não estiver clara, a IA deve deduzir o gabarito correto com base no seu conhecimento, inserindo `is_ai_generated = True` e colocando uma justificativa sucinta no `related_theory_text`.

3. **Camada de Backend (API)**
   - Um novo endpoint no `session.py`: `GET /session/module/{module_id}`.
   - Este endpoint retornará os dados organizados como no `/daily`, mas servindo sob demanda sempre que o usuário clicar em uma matéria específica.

4. **Camada de Frontend (React)**
   - Um novo menu lateral ou barra de navegação no `App.jsx` que busca as matérias do banco (rota `/modules/`) e as exibe.
   - Ao selecionar uma matéria, o app chama a nova rota `/session/module/{module_id}`.
   - Em `QuestionsTab.jsx`, o gabarito exibirá uma marca visual (ex: ícone de 🤖) se `is_ai_generated` for verdadeiro, alertando o usuário.
