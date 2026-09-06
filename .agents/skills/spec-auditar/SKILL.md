---
name: spec-auditar
description: Auditoria final da feature implementada (gate). Baseia-se na skill de code-review para garantir imparcialidade técnica e cruza os arquivos com a Especificação (AC-xxx) para provar a entrega.
---

# Fase 4: Auditar (Spec-Driven)

O gate final. A regra principal: **A máquina prova, não a IA.** Esta skill audita o código entregue e os três arquivos mestres (`spec.md`, `plano-execucao.md` e `tasks.md`) para garantir que nenhuma ponta solta ficou pelo caminho.

## Regras de Execução

Ao ser invocada (ex: `/spec-auditar [nome da feature]`):

1. **Hard Stop e Leitura dos Arquivos Mestres**:
   Leia obrigatoriamente os arquivos `.spec/features/<nome-da-feature>/tasks.md` E `.spec/features/<nome-da-feature>/spec.md`.
   - Verifique se TODAS as tarefas `T-xxx` em `tasks.md` estão com o status `[concluida]`. 
   - Se existir alguma `[pendente]` ou `[em-andamento]`, **ABORTE IMEDIATAMENTE**. O código não está pronto para ser auditado. Diga para o usuário voltar para o `/spec-executar`.

2. **Verificação de Cobertura da Especificação (O Catálogo SDD)**:
   A principal função desta skill é garantir que nada da especificação foi esquecido. Varra o arquivo `spec.md` e cruze cada `AC-xxx` listado com os testes implementados:
   - `AC_SEM_TESTE`: Requisito `AC-xxx` especificado no `spec.md` mas sem um teste correspondente com `@spec:AC-xxx` no código. Se faltar a tag no teste, a auditoria falha.
   - `AC_SEM_PROVA`: Um teste falhou, ou está pulado (skip/todo).
   - `TESTE_ORFAO`: Um teste checa um `@spec:AC-xxx` inexistente no `spec.md`.
   - `ARQUIVO_ORFAO`: Arquivo modificado mas não mapeado na Tarefa original.
   - `ASM_ABERTA`: Suposição `aberta` no `spec.md`.

3. **Revisão Zero-Assumptions (Code-Review)**:
   - Avalie o Código (Segurança, Performance, Arquitetura) guiado estritamente pelas diretrizes de Code Review do TurnoLivre (`.antigravityrules`).

4. **Fechamento e Estado Final**:
   - Se qualquer falha for apontada, liste-as categorizadas como `[CRÍTICO]`, `[MÉDIO]`, etc. A feature NÃO pode ser aprovada.
   - Se tudo for aprovado, rode os testes (Exit 0 real), modifique o cabeçalho YAML de `spec.md` para **`status: auditada`**.
   - Linguagem fria, rigorosa e estritamente sem emojis.
