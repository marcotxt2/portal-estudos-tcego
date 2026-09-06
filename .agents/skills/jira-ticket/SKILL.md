---
name: jira-ticket
description: Guidelines and template for writing and structuring Jira tasks (Features, Bugs, Chores, Refactors) for TurnoLivre
---

# Padrão de Escrita de Tickets/Chamados (JIRA)

Este documento define o padrão obrigatório para a estruturação e escrita de tickets de tarefas (Features, Chores, Bugs) no projeto **TurnoLivre**.

## Regras de Execução da Skill
Ao criar, editar ou propor um ticket/chamado para o Jira:
1. **MANDATORIAMENTE** use a formatação Markdown padrão completa (como `#` e `##` para títulos, `**` para negrito, blocos de código com backticks, etc.).
2. **NUNCA** utilize o antigo formato de marcação Wiki do Jira (como `h1.`, `h2.`, `*texto para negrito*` ou `{code}`).
3. **SEJA EXTREMAMENTE DETALHISTA**: Os tickets não devem ser curtos ou vagos. Eles devem ser grandes, abrangentes e conter o máximo de detalhes possível, incluindo fluxos de exceção, regras de banco de dados e requisitos técnicos profundos. Não tenha medo do ticket ficar muito grande; quanto maior e mais detalhado, melhor.
4. Siga estritamente a estrutura definida na seção **Estrutura Obrigatória do Ticket/Chamado**.
5. **Integração Automática com MCP do Jira**:
   - Assim que o conteúdo do ticket estiver estruturado, use a ferramenta MCP `call_mcp_tool` (servidor: `jira`, ferramenta: `createIssue`) para registrar a tarefa automaticamente.
   - Preencha os parâmetros da chamada da seguinte forma:
     - `projectKey`: `"TUR"` (chave do projeto TurnoLivre).
     - `summary`: O título do ticket no formato `[Tipo] Nome da Funcionalidade` (ex: `[Feature] Visualização de Perfil Público`).
     - `issueType`: Mapeie o tipo do ticket para o correspondente configurado no projeto "TUR" do Jira:
       - `Feature` -> `Feature`
       - `Bug` -> `Fix`
       - `Chore` -> `Chore`
       - `Refactor` -> `Tarefa`
     - `description`: O conteúdo completo do ticket estruturado em Markdown (incluindo Objetivo, User Story, Critérios de Aceitação e Notas de Implementação).
   - Apresente ao usuário a confirmação do ticket criado no Jira com a respectiva chave/link para acesso.
   - **Sugestão de Branch Git**: Junto com a confirmação da criação do ticket, sugira o comando para criação de uma branch local no Git baseada na chave do ticket e no título formatado (slug em minúsculas, usando hifens no lugar de espaços e removendo caracteres especiais/acentos). Use os prefixos:
     - `feature/` para `Feature`
     - `bug/` para `Bug`
     - `chore/` para `Chore`
     - `refactor/` para `Refactor`
     - *Exemplo:* `git checkout -b feature/TUR-45-visualizacao-perfil-publico`

---

## Estrutura Obrigatória do Ticket/Chamado

### 1. Título do Documento (H1)
* **Sintaxe:** `# [Tipo] Nome da Funcionalidade`
* **Tipos permitidos:** `Feature`, `Bug`, `Chore`, `Refactor`.
* *Exemplo:* `# [Feature] Visualização de Perfil Público`

### 2. Objetivo do Ticket (H2)
Breve parágrafo descrevendo qual problema a funcionalidade resolve, por que ela é necessária e o impacto gerado na plataforma ou no negócio.

### 3. User Story (H2)
* **Como** [tipo de usuário/persona],  
* **Quero** [ação ou comportamento esperado],  
* **Para que** [valor ou benefício gerado].

### 4. Critérios de Aceitação (H2)
Lista com checkboxes (`- [ ]`) contendo as regras de negócio, restrições e comportamentos que o sistema deve cumprir para que o ticket seja dado como finalizado. Devem cobrir:
- Fluxos principais de sucesso.
- **Completude End-to-End**: Se a feature exibe ou consome um novo dado, deve **obrigatoriamente** haver um critério explicando como esse dado entra no sistema (formulários, captação automática, integrações). Nunca deixe pontas soltas limitando-se apenas à exibição.
- Fluxos de erro e mensagens amigáveis.
- Restrições de segurança (dados que NÃO devem ser retornados na API).

### 5. Notas de Implementação Técnica (H2)

#### Backend (Spring Boot)
1. **Endpoints**: Métodos HTTP e URIs a serem expostas.
2. **Segurança**: Regras de autorização necessárias no `SecurityConfig.java`.
3. **Mapeamento DTO**: Estrutura do DTO de resposta para evitar vazamento de dados.

#### Frontend (React / Vite)
1. **Componentes**: Quais componentes existentes reutilizar ou novos componentes a serem desenvolvidos.
2. **Rotas**: Caminho de rotas a ser mapeado no React Router.

#### Metodologia Recomendada
Sempre inclua uma nota sugerindo que a pessoa desenvolvedora ou agente de IA resolva o ticket utilizando **Spec Driven Development** (desenvolvimento guiado por especificação), criando um plano claro antes de escrever código.

---

## Template para Cópia (Copy-Paste)

```markdown
# [Tipo] Nome da Funcionalidade

## Objetivo do Ticket
[Breve descrição do objetivo e valor de negócio...]

---

## User Story
**Como** [persona],  
**Quero** [ação],  
**Para que** [benefício].

---

## Critérios de Aceitação
- [ ] [Critério 1 - Fluxos principais de sucesso]
- [ ] [Critério 2 - (Completude End-to-End) Se aplicável, como o dado novo é inserido/capturado pelo usuário]
- [ ] [Tratamento de exceções / cenários de erro]
- [ ] [Regras de segurança / privacidade]

---

## Notas de Implementação Técnica

### Backend (Spring Boot)
1. **Endpoint**: [Especificação de verbo HTTP e URL...]
2. **Segurança**: [Especificação de permissão necessária...]
3. **Mapeamento DTO**: [Estrutura da resposta/payload...]

### Frontend (React / Vite)
1. **Componentes**: [Detalhes dos componentes visuais...]
2. **Rotas**: [Definição de caminhos no React Router...]

### Metodologia
**Sugestão de Desenvolvimento**: Recomenda-se fortemente que o desenvolvedor ou agente de IA utilize **Spec Driven Development** para a resolução deste ticket, elaborando um plano de implementação (`implementation_plan.md`) antes de alterar qualquer código.
```
