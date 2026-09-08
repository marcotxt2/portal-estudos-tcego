#### [concluida] T-001 - Atualizar banco de dados e schemas para suportar explanation
- Refs: AC-024
- Arquivos: backend/app/models.py, backend/app/schemas.py, backend/reset_db.py
- Esforço: baixo
- Adicionar coluna JSON `explanation` no modelo `Question` e atualizar os schemas. Criar script descartável `reset_db.py` para recriar as tabelas.

#### [concluida] T-002 - Atualizar o prompt do Gemini para retornar as explicações
- Refs: AC-024
- Arquivos: backend/app/services/gemini.py
- Esforço: medio
- Modificar o prompt do LLM para exigir o campo `explanation` listando a justificativa para todas as letras no JSON de extração.

#### [concluida] T-003 - Refatorar QuestionsContext para suportar histórico e navegação
- Refs: AC-023
- Arquivos: frontend/src/context/QuestionsContext.jsx
- Esforço: medio
- Transformar o estado unifocal em um dicionário `answers` para persistir respostas da sessão. Adicionar `handlePrevious` e `jumpToIndex`.

#### [concluida] T-004 - Implementar UI de paginação e bloco de explicação
- Refs: AC-022, AC-025
- Arquivos: frontend/src/components/QuestionsTab.jsx
- Esforço: alto
- Adicionar barra de progresso numérica na parte inferior. Renderizar dinamicamente o bloco de explicação abaixo da questão quando ela for respondida (`showResult == true`). O bloco deve mapear a justificativa apenas da alternativa correta e da alternativa selecionada (se errada).
