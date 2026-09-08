---
status: auditada
---

# Correção da Extração de Questões com Explicação

## Histórias de Usuário

### US-016 - Extração confiável de questões com explicações
Como usuário, quero que o sistema consiga extrair as questões (junto com as explicações) corretamente dos PDFs, ignorando completamente blocos de teoria, para que eu tenha um banco de questões funcional e com gabarito comentado, sem gasto desnecessário de tokens.

## Critérios de Aceite

### AC-026 - Inserção correta de questões
- **Dado** que o usuário faz upload de um PDF que contém questões de concurso
- **Quando** o processamento pelo Gemini for concluído
- **Então** o sistema deve ter extraído e inserido no banco de dados APENAS as questões (ignorando teoria).
- **E** a lista de questões no frontend deve aumentar de acordo com as questões contidas no PDF.

### AC-027 - Estrutura resiliente para explicação
- **Dado** que a IA extrai a questão do PDF
- **Quando** ela gera a justificativa da questão
- **Então** o modelo de prompt e o schema Pydantic devem definir o campo `explanation` como uma `String` simples (texto corrido único explicando a questão como um todo), substituindo a antiga estrutura de dicionário.
- **E** o prompt deve conter instruções explícitas para ignorar completamente qualquer texto de teoria ou introdução, focando apenas em questões.
- **E** as questões devem sempre ser retornadas corretamente no array `questions` do JSON.

## Suposições
- **ASM-015** - confirmada - Supomos que a exigência de criar um dicionário rigoroso de explicações para cada alternativa separadamente (`{"A": "...", "B": "..."}`) estava sobrecarregando o modelo (Gemini Flash) ou causando confusão estrutural quando o PDF é longo, levando a IA a omitir o array `questions` inteiro ou agrupar as questões como blocos de texto genérico dentro de `theories`.

## Decisoes Tomadas
- **Q-014** - Devemos simplificar o campo `explanation` de um `Dict` para uma simples `String`? **Decisao: Sim, simplificar para String única. Isso facilita a geração pela IA, evita falhas no schema JSON e é mais fácil de processar e exibir.** Impacta AC-027.
- **Q-015** - Devemos ajustar o prompt para focar apenas nas questões? **Decisao: Sim, ajustar o prompt para ignorar blocos de teoria e focar exclusivamente nas questões.** Impacta AC-027.
- **Q-016** - Devemos continuar extraindo e exibindo Teoria? **Decisao: Não. Todo o módulo de Teoria foi removido da aplicação (backend e frontend) para baratear o custo com IA e evitar qualquer confusão estrutural (bugfix final).** Impacta US-016.
