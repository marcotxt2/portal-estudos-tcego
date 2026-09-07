---
status: implementada
---

# Feature: Correcao do Pipeline de Upload e Extracao de PDF

## Historias de Usuario

- **US-004**: Como usuario, quero que ao enviar um PDF pela aba "Upload PDF" o sistema realmente processe o arquivo, extraia as teorias e questoes e as salve no banco de dados, para que eu possa estuda-las na plataforma.
- **US-005**: Como usuario, quero ver um feedback claro e honesto do que aconteceu durante o processamento (sucesso, erro, motivo), para que eu saiba se o meu material foi importado ou se preciso tentar novamente.

## Criterios de Aceite

- **AC-005** (Upload dispara processamento real):
  - Dado que eu seleciono uma materia, escolho um arquivo PDF valido e clico em "Fazer Upload e Iniciar Extracao",
  - Quando o backend recebe o arquivo,
  - Entao o backend deve criar um registro UploadTask com status pending, salvar o arquivo em disco e disparar process_pdf_background como tarefa de background.

- **AC-006** (Progressao de status observavel):
  - Dado que um upload foi enviado com sucesso,
  - Quando o frontend faz polling via GET /api/modules/upload/{task_id}/status a cada 3 segundos,
  - Entao o status deve evoluir de pending para processing (com processed_chunks incrementando) e finalmente para completed ou error, com o erro_message preenchido em caso de falha.

- **AC-007** (Conteudo aparece apos conclusao):
  - Dado que o status do task chegou a completed,
  - Quando o usuario navega para a aba "Teoria" ou "Questoes" da materia em que fez o upload,
  - Entao as teorias e questoes extraidas devem aparecer listadas -- ou seja, GET /api/session/module/{module_id} deve retornar o conteudo recem inserido.

- **AC-008** (Mensagem de erro inteligivel):
  - Dado que o processamento falhou (status error),
  - Quando o frontend exibe o estado do task,
  - Entao a mensagem de erro deve ser visivel para o usuario na propria aba de upload, nao apenas no console do backend.

## Suposicoes

- **ASM-004**: O endpoint POST /api/modules/upload/ esta registrado e acessivel. A falha esta no servico de background (extractor.py): o SDK google-genai rejeita o schema JSON com / gerado por model_json_schema(). Status: *confirmada*.
- **ASM-005**: O pdfplumber consegue extrair texto do PDF fornecido pelo usuario -- a extracao de texto nao e o problema, o problema e o schema passado ao Gemini. Status: *confirmada*.
- **ASM-006**: A tabela upload_tasks existe no banco de dados em producao (o polling de status funciona e retorna 200). Status: *confirmada*.
- **ASM-007**: O modelo gemini-2.5-flash esta disponivel e a API key tem cota. O problema nao e a key, e o schema. Status: *confirmada*.

## Decisoes Tomadas

- **Q-004**: O status muda para "concluido" mas nao ha conteudo em Teoria e Questoes? **Decisao: O status completed e falso -- o loop de chunks captura a excecao individualmente e continua, marcando a task como completed mesmo sem ter inserido nada. O erro real e no schema Pydantic passado ao SDK Gemini.** Impacta AC-006, AC-007.
- **Q-005**: Docker rodando normalmente, GEMINI_API_KEY presente no .env. **Decisao: A key existe e os containers estao saudaveis. O problema e exclusivamente no codigo do extractor.py.** Impacta ASM-004, ASM-007.
- **Q-006**: Sem erros no console do navegador. **Decisao: O frontend funciona corretamente. O bug e silencioso no backend -- a excecao e capturada e engolida dentro do loop de chunks, fazendo a task aparecer como completed para o frontend.** Impacta AC-006, AC-008.

## Causa Raiz Tecnica (Diagnostico)

O arquivo backend/app/services/extractor.py usa model_json_schema() para gerar o schema e passa como dict para o SDK Gemini via esponse_schema. A versao atual do SDK google-genai (>=0.8) nao suporta schemas com  e  (JSON Schema com referencias). A correcao e passar a classe Pydantic ExtractedContent diretamente no parametro esponse_schema, sem serializar para dict. Alem disso, o loop de chunks silencia o erro com except Exception as e: ... db.rollback() sem propagar para o error_message da task, fazendo o frontend exibir "completed" mesmo sem dados.
