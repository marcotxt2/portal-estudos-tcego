---
name: spec-executar
description: Executa a implementação da feature (buildar código funcional) guiado pela lista de tarefas (T-xxx) e critérios de aceite (AC-xxx).
---

# Fase 3: Executar (Spec-Driven)

Esta skill executa a implementação mecânica das tarefas que foram arquitetadas no `/spec-projetar`. A prova da entrega não é sua palavra, mas sim a saída do test runner (Exit Code 0).

## Regras de Execução

Ao ser invocada (ex: `/spec-executar [nome da feature]`):

1. **Hard Stop (O Bloqueio de Fase)**:
   Leia `.spec/features/<nome-da-feature>/spec.md` e os arquivos irmãos `plano-execucao.md` e `tasks.md`.
   - Se o status do `spec.md` for `rascunho`, **ABORTE**. Diga: "Volte para a etapa `/spec-projetar` ou `/spec-especificar`."
   - Se os arquivos `plano-execucao.md` ou `tasks.md` não existirem, **ABORTE**. O projeto não foi arquitetado ainda.
   - Estando tudo certo, modifique o cabeçalho YAML de `spec.md` para `status: em-implementacao`.

2. **Scaffold de Testes (TDD)**:
   - Leia a próxima tarefa `[pendente]` no `tasks.md`.
   - Antes do código funcional, escreva o esqueleto do teste para o AC correspondente.
   - OBRIGATÓRIO: A anotação exata `@spec:AC-xxx` deve estar no título do teste.

3. **Ciclo Atômico de Implementação**:
   - Modifique estritamente os `Arquivos:` apontados na Tarefa atual.
   - **A Máquina Prova:** Rode os testes (ex: `npm run test` ou `mvn test`). "Testes pulados não são prova". 

4. **Registro de Estado**:
   - Atualize permanentemente o arquivo `tasks.md`: troque o prefixo para `[em-andamento]` no início e para `[concluida]` quando os testes passarem.
   - Reflita o status no artefato temporário `task.md` (da interface do chat) para visualização.

5. **Regras Finais**:
   - Só implemente código amparado por um `AC-xxx` mapeado na sua `T-xxx` atual.
   - Respostas secas, diretas e estritamente sem uso de emojis.
