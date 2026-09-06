---
name: verify-build
description: Validates the technical integrity of TurnoLivre by running backend compile/tests (Maven) and frontend lint/build (npm in /web), and proposing or applying fixes for any encountered errors.
---

# Validação Técnica e Testes Locais (Verify Build)

Esta skill executa uma verificação completa de integridade técnica no projeto TurnoLivre (backend e frontend). Ela deve ser utilizada antes de submeter commits, abrir Pull Requests ou quando houver dúvidas sobre a compilação e estabilidade do código.

## Regras de Execução da Skill
Quando esta skill for invocada (ex: `/verify-build` ou antes de acionar `/submit-pr`):

1. **Validação do Backend (Spring Boot / Maven)**:
   - Execute a verificação do backend utilizando o wrapper do Maven.
   - No terminal PowerShell (a partir da raiz do projeto):
     - Comando padrão (com testes): `& .\api\mvnw.cmd -f .\api\pom.xml test`
     - Comando rápido (somente compilação, se solicitado): `& .\api\mvnw.cmd -f .\api\pom.xml clean compile -DskipTests`
   - Analise a saída do terminal. Se o build e os testes passarem sem erros, marque o backend como conforme.
   - **Em caso de falha no Backend**:
     - Analise o stacktrace para identificar exatamente o arquivo `.java`, número da linha e motivo da falha (erro de tipagem, dependência ausente, falha de asserção em teste).
     - Leia o arquivo com problema via `view_file`.
     - Aplique a correção necessária no código utilizando `replace_file_content` (ou `multi_replace_file_content`) caso a causa seja determinística (ex: import faltando, alteração de assinatura de método, ajuste em DTO). Se a solução exigir decisão arquitetural, apresente o diagnóstico ao usuário antes de alterar.

2. **Validação do Frontend (React / Vite / ESLint)**:
   - Execute a verificação estática (ESLint) e a compilação do TypeScript/Vite na pasta `web`:
     - Comando no terminal (com `Cwd` configurado para o diretório `web` ou executado em sequência): `npm run lint && npm run build`
   - Analise os relatórios gerados pelo ESLint e pelo compilador do TypeScript (`tsc`).
   - **Em caso de falha no Frontend**:
     - Identifique os arquivos `.ts` ou `.tsx` que apresentaram erros de tipagem, variáveis não utilizadas, dependências ausentes em hooks (`useEffect`/`useCallback`) ou erros de compilação.
     - Leia o trecho do arquivo problemático usando `view_file`.
     - Corrija o código de forma automatizada usando `replace_file_content` para sanar os avisos e erros apontados pelo linter/compilador.

3. **Ciclo de Revalidação**:
   - Se qualquer correção automática tiver sido aplicada em um dos módulos, execute novamente o respectivo comando de verificação (`mvnw test` para backend ou `npm run lint && npm run build` para frontend).
   - O objetivo é confirmar que a correção resolveu o erro original sem introduzir regressões técnicas.

4. **Relatório Técnico Final**:
   - Apresente no chat o resumo consolidado contendo:
     - **Status do Backend**: Aprovado direto ou Aprovado após Correção Automática (especificando qual arquivo foi corrigido e o motivo).
     - **Status do Frontend**: Aprovado direto ou Aprovado após Correção Automática (especificando qual arquivo foi corrigido e o motivo).
     - **Lista de Ajustes Realizados**: Detalhamento técnico das intervenções feitas no código durante a verificação.
   - **Regra Estrita de Estilo**: Nunca utilize emojis no relatório, nos títulos ou na descrição dos problemas, mantendo a conformidade absoluta com o `.antigravityrules`.
