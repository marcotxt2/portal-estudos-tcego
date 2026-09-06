---
name: verify-build
description: Validates the technical integrity of Portal de Estudos by running backend compile/tests (pytest) and frontend lint/build (npm in /frontend), and proposing or applying fixes for any encountered errors.
---

# Validação Técnica e Testes Locais (Verify Build)

Esta skill executa uma verificação completa de integridade técnica no projeto Portal de Estudos (backend e frontend). Ela deve ser utilizada antes de submeter commits, ou quando houver dúvidas sobre a compilação e estabilidade do código.

## Regras de Execução da Skill
Quando esta skill for invocada (ex: `/verify-build`):

1. **Validação do Backend (FastAPI / pytest)**:
   - Execute a verificação do backend utilizando o pytest na pasta `backend`.
   - No terminal PowerShell (a partir da raiz do projeto):
     - `cd backend; pytest`
   - Se o projeto utilizar `mypy` ou outro linter, adicione a checagem: `cd backend; flake8 .`
   - Analise a saída do terminal. Se o build e os testes passarem sem erros, marque o backend como conforme.
   - **Em caso de falha no Backend**:
     - Analise o stacktrace para identificar exatamente o arquivo `.py`, número da linha e motivo da falha.
     - Leia o arquivo com problema via `view_file`.
     - Aplique a correção necessária no código utilizando `replace_file_content`.

2. **Validação do Frontend (React / Vite / ESLint)**:
   - Execute a verificação estática (ESLint) e a compilação do TypeScript/Vite na pasta `frontend`:
     - Comando no terminal (com `Cwd` configurado para o diretório `frontend` ou executado em sequência): `npm run lint; npm run build`
   - Analise os relatórios gerados pelo ESLint e pelo compilador do Vite.
   - **Em caso de falha no Frontend**:
     - Identifique os arquivos `.jsx` ou `.tsx` que apresentaram erros.
     - Leia o trecho do arquivo problemático usando `view_file`.
     - Corrija o código de forma automatizada usando `replace_file_content`.

3. **Ciclo de Revalidação**:
   - Se qualquer correção automática tiver sido aplicada em um dos módulos, execute novamente o respectivo comando de verificação.

4. **Relatório Técnico Final**:
   - Apresente no chat o resumo consolidado contendo:
     - **Status do Backend**: Aprovado direto ou Aprovado após Correção Automática.
     - **Status do Frontend**: Aprovado direto ou Aprovado após Correção Automática.
     - **Lista de Ajustes Realizados**: Detalhamento técnico das intervenções feitas.
   - **Regra Estrita de Estilo**: Nunca utilize emojis no relatório, nos títulos ou na descrição dos problemas.
