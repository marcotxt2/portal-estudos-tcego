# Instrucoes para o Agente de Gabarito + Classificacao
# @spec:AC-080, AC-081

## Ferramentas a usar

1. Use `view_file` para ler o `questions.json`.
2. Processe TODAS as 400 questoes em memoria.
3. Use `write_to_file` com `Overwrite=true` para salvar o arquivo completo atualizado.
   NAO exiba o JSON no chat — salve direto no arquivo.

---

## Objetivo

Ler o arquivo `extractor/questions.json`, para cada questao realizar TRES tarefas e
salvar o arquivo atualizado em disco ao final.

---

## Tarefa 1 - Gabarito

Para cada questao com `correct_option == null`:
- Ler `enunciado` e `alternativas` (A a E).
- Determinar a alternativa correta usando seu conhecimento tecnico.
- Preencher `correct_option` com "A", "B", "C", "D" ou "E".
- Manter `is_ai_generated = true`.
- NAO alterar questoes que ja possuem `correct_option` preenchido.

---

## Tarefa 2 - Classificacao Canonica

Para cada questao, mapear `(disciplina, topico)` extraidos do QConcursos para o par
canonico `(materia_canonica, topico_canonico)` da lista abaixo.

**Criterio**: escolher o par canonico semanticamente mais proximo ao conteudo da questao.
Se a questao claramente nao pertence a nenhum topico da lista (ex: questoes de Direito,
Portugues, Matematica, Administracao Publica, etc.), setar `discard = true`.

Preencher sempre:
- `materia_canonica`: string exata da coluna materia abaixo (ou null se discard)
- `topico_canonico`: string exata do topico abaixo (ou null se discard)
- `discard`: true se fora do edital, false se classificado

### Lista Canonica (materia -> topicos)

**Banco de Dados (Relacional, NoSQL, Vetorial)**
- Modelagem ER, normalizacao e desnormalizacao
- SQL, algebra relacional e transacoes ACID
- Indices e otimizacao de consultas
- Procedures, triggers e views
- PostgreSQL e Oracle: administracao
- NoSQL: documentos, chave-valor, wide-column, grafos
- Bancos vetoriais e embeddings
- Replicacao, backup, HA e governanca

**Engenharia de Software e Desenvolvimento**
- Fundamentos e ciclo de vida
- Ageis: Scrum, Kanban, XP, Lean
- Requisitos e historias de usuario
- Arquitetura: camadas, SOA, microsservicos, eventos
- Principios SOLID, DRY, KISS, YAGNI
- UML e BPMN
- Design Patterns (criacionais, estruturais, comportamentais)
- Qualidade, testes e refatoracao
- Algoritmos, logica e estruturas de dados
- POO e programacao funcional
- Java, JavaScript, Node.js, Python
- React e desenvolvimento front-end
- APIs RESTful, GraphQL, WebSockets
- Autenticacao: OAuth 2.0, OIDC, JWT
- HTML5, CSS3, TypeScript
- Git e documentacao de APIs
- CI/CD e pipelines de automacao
- Infraestrutura como codigo e configuracao
- Observabilidade: metricas, logs, traces
- Git Flow, trunk-based, pull requests
- Docker, Docker Compose e Kubernetes
- GitHub Actions, GitLab CI/CD, Jenkins

**Governança de TI e Contratações TIC**
- COBIT 2019, ITIL v4, ISO/IEC 38500:2024
- Gestao de servicos: incidentes, problemas, mudancas
- Gestao de projetos: PMBOK 8a ed. e metodos ageis
- Contratacoes TIC (Lei 14.133/2021)
- Governo digital: Lei 14.129/2021 e ENGD 2024-2027
- LGPD (Lei 13.709/2018): privacy by design, minimizacao, anonimizacao
- Marco Civil da Internet (Lei 12.965/2014)
- Certificacao digital
- LC estadual 205/2025
- Normativos TCE-GO: RN 13/2016, RA 14/2024, RA 17/2024, RA 14/2025, PDTI 2025-2026

**IA, Ciência de Dados e Automação**
- Aprendizado de maquina: supervisionado, nao supervisionado, reforco
- Redes neurais e deep learning
- PLN e IA generativa
- Agentes inteligentes e modelos multimodais
- Ciencia de dados e Big Data
- Etica em IA, LGPD e Estrategia Brasileira de IA
- LLMs e programacao baseada em intencao
- Engenharia de prompts e de contexto
- Ciclo agentivo e ferramentas (Claude Code, AGY CLI)
- RAG e bancos vetoriais
- MCP e extensibilidade (skills/tool use)
- Avaliacao de codigo IA, etica e privacidade

**Língua Inglesa (Leitura Técnica)**
- Compreensao de textos tecnicos em ingles
- Vocabulario tecnico de TI

**Segurança da Informação**
- Principios CIA, autenticidade e nao repudio
- Gestao de riscos, vulnerabilidades e incidentes
- Controle de acesso e IAM
- Criptografia simetrica, assimetrica e PKI
- OWASP Top 10:2025 e DevSecOps
- Backup, continuidade e recuperacao de desastres
- Malware, phishing, firewalls, IDS/IPS, Zero Trust
- ISO/IEC 27000

**Sistemas Operacionais, Redes e Nuvem**
- Administracao Windows e Linux
- Shell scripting (Linux e PowerShell)
- Active Directory e LDAP
- TCP/IP, IPv4, IPv6, DNS, DHCP
- Protocolos: HTTP/2, HTTP/3, HTTPS, SMTP, FTP, SSH
- VPN, balanceamento de carga, proxies, firewalls, Wi-Fi
- Nuvem: IaaS, PaaS, SaaS, serverless, escalabilidade

---

## Tarefa 3 - Salvar e Relatar

Ao finalizar todas as questoes, salvar o `questions.json` atualizado em disco.
Exibir o relatorio:
- Total de questoes no arquivo
- Total com correct_option preenchido agora
- Total classificados (discard=false)
- Total descartados (discard=true) — listar disciplinas mais comuns dos descartados
- Total com erro

---

## Caminho do arquivo

`c:\Users\marco\OneDrive\Documentos\Repositorios\Concurso\extractor\questions.json`

## Contexto das questoes

Todas sao do concurso FCC para TCE-GO, area de Tecnologia da Informacao.
O .har capturou o filtro por knowledge_area_ids=13 (TI), mas algumas questoes
podem ter escapado (ex: questoes de conhecimentos basicos) — estas devem ser descartadas.
