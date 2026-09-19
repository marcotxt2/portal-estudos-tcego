# Instrucoes para o Agente de Justificativas
# @spec:AC-082, AC-083

## Ferramentas a usar

1. Use `view_file` para ler o `questions.json`.
2. Processe TODAS as questoes com `discard=false` e `explanation=null`.
3. Use `write_to_file` com `Overwrite=true` para salvar o arquivo completo atualizado.
   NAO exiba o JSON no chat — salve direto no arquivo.

---

## Objetivo

Ler o arquivo `extractor/questions.json` (que ja deve ter `correct_option` preenchido
pela etapa anterior), gerar uma explicacao tecnica para cada questao sem `explanation`,
e salvar o arquivo atualizado em disco.

## Regras

1. Para cada questao com `explanation == null` ou `explanation == ""`:
   - Ler `enunciado`, `alternativas` e `correct_option`.
   - Escrever uma explicacao tecnica de 1 a 3 paragrafos que:
     a. Justifique por que a alternativa em `correct_option` esta correta.
     b. Aponte de forma concisa por que as demais alternativas estao erradas
        (pode ser em um unico paragrafo discutindo as incorretas em conjunto).
   - Preencher o campo `explanation` com o texto gerado.

2. NAO reprocessar questoes que ja possuem `explanation` preenchida e nao vazia.

3. NAO alterar nenhum outro campo (`correct_option`, `is_ai_generated`, etc).

4. Ao finalizar todas as questoes, salvar o `questions.json` atualizado em disco.

5. Ao final, exibir o relatorio:
   - Total de questoes no arquivo
   - Total com explanation gerada agora
   - Total ignorados (ja tinham explanation)
   - Total com erro (se algum)

## Caminho do arquivo

`c:\Users\marco\OneDrive\Documentos\Repositorios\Concurso\extractor\questions.json`

## Contexto das questoes

Todas as questoes sao de concurso publico da banca FCC, area de Tecnologia da
Informacao. Escreva as explicacoes em portugues, com linguagem tecnica e objetiva,
como em um gabarito comentado de cursinho preparatorio para concurso.
