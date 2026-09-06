---
name: project-context
description: Gathers the current context of the project by checking recent Git merges, recent Jira tickets, and the state of the codebase.
---

# Contexto do Projeto (Project Context)

Esta skill é responsável por atualizar a IA sobre o estado atual do repositório, facilitando a retomada de trabalho ou fornecendo um relatório do que foi feito recentemente.

## Regras de Execução da Skill
Quando esta skill for invocada (ou quando o usuário solicitar um panorama/contexto do projeto):

1. **Obter Informações do Git (Main/Branch Atual)**:
   - Execute o comando git: `git log -n 5 --oneline` para ver os commits recentes.
   - Execute o comando git: `git status` para identificar se há modificações locais pendentes.

2. **Obter Informações do Jira**:
   - Use a ferramenta MCP `enhancedSearchIssues` do servidor `jira` para listar os últimos 5 tickets atualizados do projeto.
   - Parâmetros recomendados para `enhancedSearchIssues`:
     - `projectKey`: `"TUR"`
     - `jql`: `"project = TUR ORDER BY updated DESC"`
     - `maxResults`: 5
     - `fields`: `"summary,status,assignee,updated"`
   - Identifique o status dessas tarefas (Tarefa, Concluída, Em Andamento, etc.).

3. **Gerar o Relatório de Contexto**:
   - Apresente um painel consolidado formatado em Markdown com as seguintes seções:
     - **Status do Git**: Branch atual e se há arquivos modificados/não commitados localmente.
     - **Histórico Recente de Commits**: Lista dos últimos 5 commits com autor (se disponível) e descrição curta.
     - **Atividade Recente no Jira**: Tabela ou lista das 5 tarefas do Jira mais recentemente atualizadas.
     - **Análise de Foco**: Uma breve leitura dos arquivos recentemente modificados no Git (se houver) para deduzir em qual funcionalidade/módulo o time está trabalhando no momento.
