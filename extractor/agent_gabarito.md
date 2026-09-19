# Instrucoes para o Agente de Gabarito
# @spec:AC-080, AC-081

## Objetivo

Ler o arquivo `extractor/questions.json`, determinar a alternativa correta de cada
questao onde `correct_option` for `null`, e salvar o arquivo atualizado em disco.

## Regras

1. Para cada questao com `correct_option == null`:
   - Ler o campo `enunciado` e todas as alternativas em `alternativas` (A a E).
   - Usar seu conhecimento tecnico para determinar qual alternativa e a correta.
   - Preencher `correct_option` com a letra correspondente: "A", "B", "C", "D" ou "E".
   - Manter `is_ai_generated = true`.

2. NAO alterar questoes que ja possuem `correct_option` preenchido.

3. NAO alterar o campo `explanation` nesta etapa.

4. Ao finalizar todas as questoes, salvar o `questions.json` atualizado em disco
   usando `write_to_file` ou equivalente com o mesmo caminho do arquivo original.

5. Ao final, exibir o relatorio:
   - Total de questoes no arquivo
   - Total com correct_option preenchido por voce (is_ai_generated = true)
   - Total que ja tinham correct_option (nao alterados)
   - Total com erro (se algum)

## Caminho do arquivo

`c:\Users\marco\OneDrive\Documentos\Repositorios\Concurso\extractor\questions.json`

## Contexto das questoes

Todas as questoes sao de concurso publico da banca FCC, area de Tecnologia da
Informacao. As disciplinas incluem: Banco de Dados, Seguranca da Informacao,
Redes de Computadores, Engenharia de Software, Algoritmos, Sistemas Operacionais, etc.
