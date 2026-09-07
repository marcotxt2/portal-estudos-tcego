# Plano de Execucao: Correcao do Pipeline de Upload e Extracao de PDF

## Causa Raiz

O ackend/app/services/extractor.py passa ExtractedContent.model_json_schema() (um dict com $ref/$defs) como esponse_schema ao SDK google-genai. A versao atual do SDK nao suporta esse formato -- ele exige a classe Pydantic diretamente. O erro Extra inputs are not permitted e lancado dentro do retry, que esgota as 5 tentativas e lanca RetryError. O except do loop de chunks captura o RetryError, faz db.rollback() e continua -- nao ha insercao de dados e ao final a task e marcada como completed erroneamente.

## Decisoes Tecnicas

### 1. Correcao do schema Gemini (bug principal)
- **Arquivo**: ackend/app/services/extractor.py
- **Mudanca**: Remover "Retorne EXCLUSIVAMENTE um objeto JSON valido seguindo este formato:\n{ExtractedContent.model_json_schema()}\n\n" do prompt e passar esponse_schema=ExtractedContent diretamente na config da chamada, substituindo 'response_mime_type': 'application/json' por esponse_schema=ExtractedContent.

### 2. Propagacao de erro para a task (bug secundario)
- **Arquivo**: ackend/app/services/extractor.py
- **Mudanca**: No except do loop de chunks, alem de logar, atualizar 	ask.error_message com o erro e setar 	ask.status = 'error' para que o frontend possa exibi-lo ao usuario, cumprindo AC-008.

### 3. Visibilidade do erro no frontend (AC-008)
- **Arquivo**: rontend/src/components/UploadTab.jsx
- **Mudanca**: O componente ja exibe status.error_message quando status === 'error'. A correcao no backend e suficiente para que esse caminho ja funcione. Nenhuma alteracao no frontend e necessaria.

## Fluxo Corrigido

`
Usuario -> POST /api/modules/upload/
        -> UploadTask(status=pending) criado
        -> process_pdf_background() disparado em background
        -> pdfplumber extrai texto
        -> chunks gerados
        -> para cada chunk:
              -> gemini_client.models.generate_content(response_schema=ExtractedContent)  [CORRIGIDO]
              -> theories e questions inseridos no banco
              -> task.processed_chunks += 1
        -> task.status = 'completed'
        -> frontend polling detecta 'completed'
        -> frontend chama fetchSessionByModule(module_id)
        -> teorias e questoes aparecem nas abas
`

## Modelo de Dados

Nenhuma alteracao no modelo de dados. As tabelas 	heories, questions, upload_tasks e modules ja existem e estao corretas.

## Arquivos Impactados

| Arquivo | Tipo | Mudanca |
|---------|------|---------|
| ackend/app/services/extractor.py | MODIFY | Correcao do schema + propagacao de erro |
