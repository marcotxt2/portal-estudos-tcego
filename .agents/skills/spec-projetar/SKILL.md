---
name: spec-projetar
description: Inicia a fase de Projeto e Planejamento Técnico de uma feature. Documenta decisões técnicas, design de arquitetura e resolve as Suposições (ASM) e Perguntas em Aberto (Q) baseadas na especificação.
---

# Fase 2: Projetar (Spec-Driven)

Esta skill representa a fase de planejamento técnico para o projeto TurnoLivre, ocorrendo após a aprovação da especificação. Seu objetivo é não deixar "pontas soltas" e transformar a especificação num roadmap arquitetural (`plano-execucao.md`) e numa lista de tarefas (`tasks.md`).

## Regras de Execução

Ao ser invocada (ex: `/spec-projetar [nome da feature]`):

1. **Hard Stop (O Bloqueio de Fase)**:
   A PRIMEIRA coisa que você deve fazer é ler o arquivo `.spec/features/<nome-da-feature>/spec.md`. Olhe para o cabeçalho YAML. 
   - Se o status for `rascunho`, **ABORTE A EXECUÇÃO IMEDIATAMENTE**. Diga ao usuário: "A especificação ainda está em rascunho ou possui perguntas abertas. Finalize a etapa com `/spec-especificar` antes de projetar."
   - Só prossiga se o status for `pronta`.

2. **Crie o `plano-execucao.md` (A Arquitetura)**:
   Gere ou atualize `.spec/features/<nome-da-feature>/plano-execucao.md` detalhando as decisões técnicas:
   - Backend (JPA, DTOs, Controllers), Frontend (React) e Modelo de Dados (migrations). A Regra de Ouro "Se um dado sai, ele precisa entrar" se aplica.

3. **Crie o `tasks.md` (A Âncora Mecânica)**:
   Gere o arquivo `.spec/features/<nome-da-feature>/tasks.md`. Para cada tarefa você deve usar exatamente o formato mecânico:
   ```markdown
   #### [pendente] T-xxx - Título curto da tarefa
   - Refs: AC-xxx, AC-yyy
   - Arquivos: path1.java, path2.tsx (separados por VÍRGULA)
   - Esforço: baixo|medio|alto|xalto|max
   - Descrição técnica atômica.
   ```
   *As tarefas não podem deixar NENHUM AC-xxx sem um arquivo responsável.*

4. **Trabalhe com Artifacts Temporários**:
   - Para exibição visual, crie o artefato temporário `implementation_plan.md` listando o seu plano de execução, e crie o artefato de tarefas nativo (`task.md`) espelhando as `T-xxx`. O usuário aprova por aqui.

5. **Regra de Estilo**:
   - Apresente recomendações de paralelismo baseadas na separação dos `Arquivos:` do `tasks.md`.
   - Estritamente sem emojis.
