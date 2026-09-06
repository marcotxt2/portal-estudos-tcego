---
name: code-review
description: Performs an impartial, zero-assumption code review on target files or git diffs, categorizing findings into structured sections (UX/UI, Security, Performance, Architecture, and Maintainability).
---

# Auditoria e Revisão Imparcial de Código (Code Review)

Esta skill executa uma análise técnica rigorosa, imparcial e sem contexto de conversas anteriores sobre arquivos de código ou diffs (`git diff`). O objetivo é identificar falhas ocultas, violações de arquitetura, riscos de segurança e gargalos de performance antes do envio para produção.

## Regras de Execução da Skill
Quando esta skill for invocada (ex: `/code-review` ou pedido de auditoria/revisão em arquivos ou PRs):

1. **Postura Imparcial e Zero-Contexto**:
   - Analise o código alvo (seja através do comando `git diff main...HEAD` ou inspecionando arquivos via `view_file`) de forma estritamente técnica, cética e sem assumir premissas de decisões anteriores do chat.
   - Cruzar as verificações diretamente com os guias e diretrizes do projeto (`docs/backend-security-performance-audit.md`, `docs/frontend-security-performance-audit.md` e `.antigravityrules`).

2. **Categorização Obrigatória do Relatório**:
   O diagnóstico deve ser dividido exatamente nas seguintes seções de avaliação:

   ### 1. UX / UI & Acessibilidade (Frontend)
   - Verifique a clareza e consistência visual dos componentes no React/Vite.
   - Avalie estados de carregamento (loading spinners/skeletons), tratamento de estados vazios (empty states) e mensagens de erro amigáveis para o usuário.
   - Cheque a responsividade no CSS/Tailwind e acessibilidade básica (tags semânticas, atributos `alt`, contraste e interatividade pelo teclado).

   ### 2. Segurança (Security & Proteção de Dados - Prevenção de Código "SaaS Vibe Coded" e IA)
   - **Autorização Declarativa e Prevenção de IDOR (Insecure Direct Object References):**
     - Verifique se os endpoints ou métodos de serviço não confiam cegamente na presença de um token JWT (`anyRequest().authenticated()`) nem realizam verificações manuais ad-hoc extraindo claims no Controller (`jwtUtil.extractId()`).
     - Exija controle de acesso declarativo no nível do método via `@PreAuthorize("hasRole('ADMIN')")` para superfícies administrativas ou checagem de posse real do recurso (`resource.getOwner().getId().equals(currentUserId)`) na camada de serviço.
   - **Integridade Transacional e Prevenção de Race Conditions (Check-then-Act):**
     - Em fluxos críticos ou financeiros (como aprovação de reservas, splits, estornos e processamento de pagamentos), verifique se o código protege contra cliques duplos e chamadas concorrentes.
     - Exija o uso de travamento pessimista (`SELECT ... FOR UPDATE` via `findByIdForUpdate`), versionamento otimista (`@Version` nas entidades mutáveis) e integração com o serviço de idempotência (`IdempotencyService`).
   - **Blindagem e Gestão de Segredos (Em Repouso e no Código Fonte):**
     - Proíba estritamente segredos, chaves JWT, senhas ou tokens de integração (Stripe, Mercado Pago, Cloudinary) hardcoded no código ou em arquivos de configuração não parametrizados por variáveis de ambiente (`${VAR_ENV}`).
     - Dados sensíveis de terceiros persistidos no banco de dados (ex: `mpAccessToken`, `mpRefreshToken`) devem obrigatoriamente utilizar criptografia reversível em repouso (`@Convert(converter = AttributeConverter.class)` via AES/GCM em modo fail-closed).
   - **Superfície Administrativa, Mass Assignment e Blindagem de DTOs:**
     - Verifique se APIs administrativas (`GET /api/usuarios`, cancelamentos forçados) possuem paginação obrigatória para evitar enumeração e sobrecarga do banco, além de verificação explícita de papel (`ADMIN`).
     - Certifique-se de que nenhum endpoint retorna entidades JPA diretamente ou DTOs genéricos que vazem tokens internos, senhas encriptadas ou dados pessoais desnecessários de outras entidades vinculadas.
     - Exija validação rigorosa de entrada (`@Valid` no Controller e anotações completas do Jakarta Validation nos DTOs de requisição).
   - **Proteção de Uploads e Throttling (Rate Limiting):**
     - Em pipelines de upload de imagens ou arquivos, verifique se há validação estrita de whitelist de MIME/extensão, tamanho máximo, dimensões e limite de arquivos por recurso, impedindo que arquivos fiquem públicos antes da aprovação de moderação.
     - Endpoints públicos de login, verificação ou escrita devem estar devidamente protegidos por rate limiting por IP e por conta contra ataques de força bruta e credential stuffing.
   - **Frontend (React / Vite):**
     - Cheque riscos de XSS (como uso indevido de `dangerouslySetInnerHTML` ou interpolação não sanitizada), exposição de chaves secretas no bundle do cliente (apenas chaves `VITE_PUBLIC_*` são permitidas no front) e armazenamento inseguro de tokens sensíveis.

   ### 3. Performance & Otimização
   - **Backend:** Identifique riscos de consultas **N+1** no Spring Data JPA (falta de `FETCH JOIN` ou `@EntityGraph`), transações desnecessárias ou longas (`@Transactional`), paginação ausente em listagens (`Pageable`) e falta de índices em campos de busca frequente.
   - **Frontend:** Identifique re-renderizações desnecessárias, importações pesadas que prejudicam o bundle, e verifique a conformidade com a regra do `.antigravityrules` de usar a API nativa `Intl` do JavaScript para formatação de datas (evitando bibliotecas externas pesadas).

   ### 4. Arquitetura & Acoplamento
   - Avalie a separação de responsabilidades (Clean Architecture / SOLID):
     - **Java:** Endpoints nos Controllers não devem possuir regra de negócio complexa (devem delegar para os Services). Repositórios devem apenas manipular dados.
     - **React:** Separação clara entre componentes de UI (presentational), lógica de estado/efeitos (Custom Hooks) e requisições de API (Services/Axios).

   ### 5. Manutenibilidade & Legibilidade
   - Verifique a nomenclatura de variáveis, métodos e classes (devem ser descritivas em inglês ou português coerente com a camada).
   - Aponte blocos de código morto, excesso de comentários óbvios, complexidade ciclomática alta e tratamento genérico de exceções (`catch (Exception e)` sem repasse ou log estruturado).

3. **Formatação das Descobertas**:
   - Para cada problema identificado em qualquer seção, utilize a seguinte notação de severidade:
     - `[CRÍTICO]`: Falha grave de segurança, regressão severa de performance ou bug paralisante.
     - `[MÉDIO]`: Violação arquitetural, possível N+1 query, vazamento de entidade ou UX confusa.
     - `[BAIXO]`: Dívida técnica leve ou melhoria de legibilidade.
     - `[SUGESTÃO]`: Oportunidade de refatoração limpa ou otimização opcional.
   - Sempre forneça o link exato para o arquivo no formato `[arquivo:LXX-LYY](file:///caminho/absoluto#LXX-LYY)` acompanhado de um trecho de código demonstrando a correção proposta (diff ou bloco de código).
   - Se uma seção não apresentar problemas, declare explicitamente: *"Nenhuma pendência técnica identificada nesta categoria."*

4. **Regra Estrita de Estilo**:
   - A comunicação deve ser direta, analítica e sem rodeios.
   - Nunca utilize emojis no relatório ou nas explicações, obedecendo rigorosamente ao `.antigravityrules`.
