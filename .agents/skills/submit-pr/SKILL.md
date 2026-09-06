---
name: submit-pr
description: Automates git commit, push, GitHub Pull Request creation, and commenting the PR link on related Jira tickets.
---

# Fluxo de Commit, Pull Request e Atualização no Jira

Esta skill automatiza o ciclo final de desenvolvimento de uma tarefa: realiza o commit das alterações pendentes, envia a branch para o repositório remoto, cria o Pull Request no GitHub via CLI e comenta o link do PR diretamente nas tarefas correspondentes do Jira.

## Regras de Execução da Skill
Quando esta skill for invocada (ex: `/submit-pr` ou solicitação de criação de PR integrada ao Jira):

1. **Identificação de Contexto e Tickets**:
   - Obtenha o nome da branch atual via terminal: `git branch --show-current`.
   - Extraia todas as chaves de tickets do Jira (padrão `TUR-\d+`) presentes no nome da branch ou nos últimos commits locais.
   - Se houver múltiplos tickets no escopo (ex: `feature/TUR-68-TUR-74-...`), liste todas as chaves identificadas.
   - Verifique o estado atual dos arquivos com `git status -s` e `git diff --stat`.

2. **Commit e Push**:
   - Se houver alterações locais não commitadas (staged ou unstaged):
     - Adicione os arquivos (`git add .` ou arquivos específicos pertinentes).
     - Crie o commit seguindo o padrão Conventional Commits referenciando a(s) chave(s) do(s) ticket(s). Exemplo: `feat(TUR-77): implementar cadastro flexivel de multiplas salas`.
   - Envie a branch local para o repositório remoto: `git push -u origin <nome-da-branch>`.

3. **Criação do Pull Request no GitHub (via CLI `gh`)**:
   - Defina o título do Pull Request:
     - Para 1 ticket: use o tipo e o título da tarefa (ex: `feat(TUR-77): Cadastro de Consultorio - Multiplas Salas`).
     - Para múltiplos tickets: elabore um título sintético combinando o objetivo das tarefas (ex: `feat: integra TUR-68 e TUR-74 - fluxo de negociacao e paginacao`).
   - Execute o comando `gh pr create` fornecendo título (`--title`) e corpo (`--body`) formatado em Markdown com:
     - **Resumo das Alterações**: explicação clara do que foi desenvolvido ou corrigido.
     - **Tickets Relacionados**: lista de links para os tickets (`https://marcotulio.atlassian.net/browse/TUR-XX`).
     - **Checklist de Verificação**: itens de teste e validação cumpridos.
   - Capture a URL final do Pull Request gerado na saída do terminal.

4. **Comentário Automático no(s) Ticket(s) do Jira**:
   - Para cada chave `TUR-XX` identificada, execute a ferramenta MCP `call_mcp_tool` (servidor: `jira`, ferramenta: `addIssueComment`).
   - **Nota Importante:** A ferramenta `addIssueComment` do MCP encapsula a string do parâmetro `body` diretamente em um bloco de texto ADF sem interpretar sintaxe Markdown complexa (colchetes, asteriscos ou crases). Portanto, envie o comentário como texto plano puro com a URL crua (que o Jira Cloud linkifica automaticamente), evitando qualquer marcação Markdown para não quebrar a exibição visual.
   - Parâmetros da chamada:
     - `issueKey`: a chave da tarefa (ex: `"TUR-77"`).
     - `body`: comentário em texto plano puro:
       ```
       Pull Request aberto para revisão:
       URL: <URL_DO_PR>
       Branch: <nome-da-branch>
       ```

5. **Relatório de Execução**:
   - Apresente o resultado final no chat contendo:
     - Hash e mensagem do commit.
     - Link do Pull Request criado no GitHub.
     - Confirmação de atualização nos tickets do Jira com o respectivo comentário inserido.
   - **Regra Estrita de Estilo**: Nunca utilize emojis em nenhuma etapa (commit, PR, comentários no Jira ou mensagem final), respeitando rigorosamente o `.antigravityrules`.
