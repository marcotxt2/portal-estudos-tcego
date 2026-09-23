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

## Regras Rigorosas (Anti-Preguica e Qualidade)

1. **Processamento em Lotes:**
   Como sao muitas questoes para a memoria de atencao, processe o arquivo em lotes de 50 questoes por vez. Somente apos justificar 50 questoes com alta qualidade, salve no arquivo e puxe as proximas 50. Nao tenha pressa, o objetivo e qualidade.

2. **Geracao da Justificativa (explanation):**
   Para cada questao com `discard == false` E `explanation == null`:
   - Leia o `enunciado`, as `alternativas` e o `correct_option`.
   - Escreva uma explicacao tecnica em Markdown (1 a 3 paragrafos) que:
     a) Justifique claramente o motivo tecnico da alternativa em `correct_option` estar correta.
     b) Aponte de forma concisa o erro principal das outras alternativas (ex: "As demais estao incorretas porque...").
   - A explicacao deve parecer um gabarito comentado de cursinho preparatorio (explicativo e didatico).

3. **Restricoes Criticas:**
   - NAO invente justificativas vazias ou genéricas ("Esta correta porque e a verdadeira").
   - NAO crie scripts Python para fazer isso (a tarefa deve ser feita pela sua propria inteligencia analitica).
   - NAO altere os campos `correct_option`, `discard` ou qualquer outro.
   - Pule questoes que possuem `discard == true` (nao gere justificativa para elas).

4. **Persistencia:**
   Ao finalizar TODAS as questoes validas, salve o `questions.json` usando `write_to_file`.

5. Ao final de todos os lotes, exiba o relatorio:
   - Total de questoes validas no arquivo
   - Total com explanation gerada agora
   - Total ignoradas (discard=true ou explanation ja existia)

## Caminho do arquivo

`c:\Users\marco\OneDrive\Documentos\Repositorios\Concurso\extractor\questions.json`

## Contexto das questoes

Todas as questoes sao de concurso publico da banca FCC, area de Tecnologia da
Informacao. Escreva as explicacoes em portugues, com linguagem tecnica e objetiva,
como em um gabarito comentado de cursinho preparatorio para concurso.
