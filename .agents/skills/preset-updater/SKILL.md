---
name: preset-updater
description: Automatically scans all local skills in .agents/skills/ and updates the Jira PRESET ticket (TUR-78) with the complete catalog and usage instructions.
---

# Atualização Automática de PRESETS no Jira (Preset Updater)

Esta skill é responsável por rastrear todas as skills instaladas no repositório TurnoLivre e atualizar automaticamente o chamado de PRESET no Jira (atualmente o ticket **TUR-78**: `[PRESET] Guia e Catálogo de Skills do Agente (Antigravity)`), garantindo que a documentação visual no quadro do Jira esteja sempre 100% sincronizada com as skills locais.

## Regras de Execução da Skill
Quando esta skill for invocada (ex: via `/preset-updater` ou acionada automaticamente após a criação de qualquer nova skill):

1. **Varredura e Descoberta de Skills (`.agents/skills`)**:
   - Liste todos os diretórios dentro de `c:\Users\marco\OneDrive\Documentos\Repositorios\TurnoLivre\.agents\skills`.
   - Para cada pasta de skill identificada, leia o arquivo `SKILL.md` via `view_file` e extraia as propriedades `name` e `description` do frontmatter YAML.

2. **Formatação do Catálogo de Skills (Markdown)**:
   - Estruture a descrição técnica do chamado contendo o resumo e como invocar cada skill:
     ```markdown
     Guia de utilização de todas as skills do agente no projeto TurnoLivre.

     Como utilizar e resumo das skills disponíveis:
     - `/docker-update` -> Reconstrói e atualiza os containers Docker (`backend`, `frontend`, `db`) com multi-stage build, limpa imagens órfãs e verifica a saúde do ambiente.
     - `/jira-ticket` -> Cria ou estrutura um ticket/chamado no Jira seguindo o padrão arquitetural do projeto.
     - `/preset-updater` -> Escaneia as skills instaladas em `.agents/skills/` e atualiza automaticamente este chamado no Jira (`TUR-78`).
     - `/project-context` -> Analisa o contexto atual do repositório, inspecionando últimos merges, tickets finalizados e estrutura central do código.
     - `/submit-pr` -> Automatiza o fluxo de commit, push, abertura de Pull Request via CLI (`gh`) e publica o link do PR no comentário das tarefas do Jira.
     - `/verify-build` -> Roda a verificação de testes e compilação do backend (Maven) e lint/build do frontend (Vite), corrigindo erros ou avisos automaticamente.

     Nota: Este preset é atualizado automaticamente sempre que uma nova skill for adicionada ou modificada no diretório `.agents/skills/`.
     ```

3. **Atualização no Jira (via MCP `updateIssue`)**:
   - Execute `call_mcp_tool` no servidor `jira` utilizando a ferramenta `updateIssue`.
   - Parâmetros da chamada:
     - `issueKey`: `"TUR-78"`
     - `description`: o texto completo formatado em Markdown com a lista de todas as skills identificadas no passo anterior.

4. **Verificação de Posição (Coluna PRESETS)**:
   - Verifique se o ticket `TUR-78` está localizado na coluna de status `PRESETS`. Se por algum motivo não estiver, execute `transitionIssue` (com o ID de transição para `PRESETS`, normalmente ID `2`) para reposicionar o chamado.

5. **Relatório de Conclusão**:
   - Informe no chat o total de skills encontradas, seus nomes e confirme a atualização realizada na tarefa `TUR-78` do Jira.
   - **Regra Estrita de Estilo**: Nunca utilize emojis na descrição enviada ao Jira ou no relatório final enviado ao usuário, obedecendo ao `.antigravityrules`.
