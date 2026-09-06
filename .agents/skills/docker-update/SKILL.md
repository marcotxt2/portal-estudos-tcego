---
name: docker-update
description: Rebuilds and updates Docker containers (backend, frontend, or all) using multi-stage builds, cleans up dangling images, and verifies container health.
---

# Atualização de Containers Docker (Docker Update)

Esta skill automatiza o processo de reconstrução, atualização e verificação de saúde dos containers Docker do projeto Portal de Estudos (`backend`, `frontend`, `db` e `extractor`) após modificações no código-fonte ou nas configurações de ambiente.

## Regras de Execução da Skill
Quando esta skill for invocada (ex: `/docker-update` ou solicitação de atualização do Docker):

1. **Verificação Prévia de Ambiente (`.env`)**:
   - Antes de rodar o Docker Compose, verifique se os arquivos `.env` na raiz do projeto e `extractor/.env` existem no sistema de arquivos.
   - Se algum deles não existir, interrompa ou avise o usuário orientando a cópia dos arquivos `.example`.

2. **Identificação do Alvo e Escopo**:
   - Determine qual serviço deve ser atualizado de acordo com o parâmetro passado ou contexto da conversa:
     - `all` (ou sem parâmetro): Atualiza todos os serviços do `docker-compose.yml`.
     - `backend`: Atualiza exclusivamente o container do FastAPI (`portal_estudos_backend`).
     - `frontend`: Atualiza exclusivamente o container do React/Vite (`portal_estudos_frontend`).
     - `--no-cache` (ou limpo): Força a reconstrução do zero sem utilizar o cache das camadas Docker.

3. **Execução do Rebuild e Atualização**:
   - Execute o comando no terminal (na raiz do projeto):
     - Atualização geral incremental: `docker compose up -d --build --remove-orphans`
     - Atualização do Backend: `docker compose up -d --build backend`
     - Atualização do Frontend: `docker compose up -d --build frontend`
     - Rebuild sem cache (se solicitado explicitamente): `docker compose build --no-cache <servico>` seguido de `docker compose up -d <servico>`
   - Acompanhe a saída do terminal para certificar-se de que os builds foram concluídos com êxito.

4. **Limpeza de Imagens Órfãs (Dangling Images Prune)**:
   - Após a inicialização dos novos containers, execute no terminal:
     - Comando: `docker image prune -f`
   - Isso remove as imagens intermediárias antigas geradas durante os builds, liberando espaço em disco no ambiente local.

5. **Verificação de Status e Saúde (Health Check)**:
   - Verifique se os containers estão rodando de forma estável com o comando:
     - `docker compose ps`
   - Se algum container apresentar status `Restarting`, `Exited` ou falha na inicialização, consulte os últimos registros do log (`docker compose logs --tail=30 <servico>`) para identificar a causa raiz (ex: erro de conexão com banco, erro na API do Gemini ou falha de porta).

6. **Relatório Técnico Final**:
   - Exiba no chat o status da operação contendo:
     - **Alvo Atualizado**: Serviço(s) reconstruído(s) (`backend`, `frontend` ou `ambos`).
     - **Tabela de Status dos Containers**: Nome do container, status (`Up`/`Exited`), portas mapeadas e tempo de atividade.
     - **Espaço Liberado**: Resultado do comando de limpeza de imagens órfãs.
   - **Regra Estrita de Estilo**: Nunca utilize emojis no relatório, nos títulos ou nas tabelas.
