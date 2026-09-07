# Tarefas

#### [concluida] T-005 - Corrigir schema Gemini no extractor
- Refs: AC-005, AC-006, AC-007
- Arquivos: backend/app/services/extractor.py
- Esforco: baixo
- Descricao tecnica atomica: Substituiu response_schema=ExtractedContent (incompativel com SDK 0.3.0 + schemas aninhados) por response_mime_type=application/json com schema de exemplo embutido no prompt. O SDK 0.3.0 nao suporta conversao de classes Pydantic com submodelos aninhados (gera / que o SDK rejeita internamente).

#### [concluida] T-006 - Propagar erro de chunk para a UploadTask
- Refs: AC-006, AC-008
- Arquivos: backend/app/services/extractor.py
- Esforco: baixo
- Descricao tecnica atomica: No bloco except do loop de chunks em process_pdf_background, alem do db.rollback() e print, atualiza task.error_message concatenando o erro e seta task.status = 'error' seguido de db.commit(). Garante que a mensagem de erro chega ao frontend via endpoint de status.

#### [concluida] T-007 - Ampliar VARCHAR de correct_option e chosen_option
- Refs: AC-001 (herdado da feature anterior)
- Arquivos: backend/app/models.py
- Esforco: baixo
- Descricao tecnica atomica: Alterou correct_option e chosen_option de VARCHAR(1) para VARCHAR(10) no modelo SQLAlchemy e via ALTER TABLE no banco de producao. Necessario para suportar respostas C/E (Certo, Errado).
