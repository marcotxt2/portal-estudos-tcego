---
name: spec-especificar
description: Inicia a fase de Especificação de uma nova feature. Levanta Histórias de Usuário (US), Critérios de Aceite (AC), Suposições (ASM) e Perguntas em Aberto (Q) baseado nos princípios do spec-driven.
---

# Fase 1: Especificar (Spec-Driven)

A maioria das ferramentas de desenvolvimento guiado gera código a partir da spec e depois a spec morre. Aqui, a **especificação continua verdadeira** porque é a âncora do desenvolvimento. Esta skill atua como a primeira etapa, onde você levanta todos os requisitos e desenha a estrutura da funcionalidade.

## O Arquivo Mestre (spec.md)

Toda a gestão de estado da feature acontecerá no arquivo `.spec/features/<nome-da-feature>/spec.md`. Ele atuará como o cadeado que libera ou bloqueia as próximas skills.

Os identificadores (`US-xxx`, `AC-xxx`, `ASM-xxx`, `Q-xxx`) **são globais e únicos** no projeto inteiro. Nunca zere a contagem ou duplique um ID existente.

- **US-xxx** (História de Usuário): Quem precisa, o que precisa e por quê.
- **AC-xxx** (Critério de Aceite): O contrato com quem não programa. Deve descrever um resultado **observável** e **amigável**, escrito em `Dado / Quando / Então`. Ex: "- **Então** a resposta chega em menos de 300ms".
- **ASM-xxx** (Suposição): Palpite seu. Status: `aberta` -> `confirmada` / `invalidada`.
- **Q-xxx** (Pergunta em Aberto): Dúvida bloqueante. Status: `aberta` -> `respondida`.

## Regras de Execução

Ao ser invocada (ex: `/spec-especificar [nome da feature]`):

1. **Crie a Especificação Central**:
   Gere o arquivo `.spec/features/<nome-da-feature>/spec.md`. No cabeçalho YAML, **OBRIGATORIAMENTE** insira `status: rascunho`. Preencha:
   
   - **Histórias de Usuário**: Detalhando as `US-xxx`.
   - **Critérios de Aceite**: Formato `Dado / Quando / Então`.
   - **Suposições** e **Perguntas em Aberto**: Liste-as. Se não houver, escreva `Nenhuma.`

2. **Hard Stop (O Bloqueio de Fase)**:
   A feature só pode ir para o Projeto (`/spec-projetar`) se estiver `pronta`. 
   Apresente a spec gerada e diga ao usuário: "A feature está em rascunho. Para avançarmos, confirme as Suposições e responda às Perguntas em Aberto".

3. **Alimentando o Arquivo (O Destravamento)**:
   Quando o usuário sanar as dúvidas (`Q-xxx` respondida, `ASM-xxx` confirmada/invalidada) ou validar que os ACs estão corretos, execute **obrigatoriamente** os passos abaixo antes de marcar `status: pronta`:

   a. **Aplique a decisão nos ACs impactados**: Reescreva cada `AC-xxx` afetado para refletir a decisão tomada. A decisão NÃO pode ficar apenas como anotação na linha da `Q-xxx` — ela deve estar embutida no critério de aceite que o implementador vai ler.

   b. **Mova as Q-xxx respondidas para a seção `## Decisoes Tomadas`**: Renomeie a seção `## Perguntas em Aberto` para `## Decisoes Tomadas` quando todas estiverem resolvidas. Cada entrada deve indicar qual AC foi impactado. Formato:
   ```
   - **Q-xxx** - [pergunta resumida]? **Decisao: [resposta objetiva].** Impacta AC-xxx.
   ```

   c. **Atualize o status das ASM-xxx** para `confirmada` ou `invalidada` com a justificativa.

   d. Somente então altere o cabeçalho para `status: pronta`.

4. **Diretrizes**:
   - Fale por extenso: "o critério de aceite (AC-003)".
   - Estritamente sem emojis.
   - Nunca deixe decisões importantes apenas como anotações nas Q-xxx. O `spec.md` é lido pelo implementador diretamente nos ACs — se a decisão não está lá, ela não existe.
