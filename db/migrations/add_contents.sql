-- migration para tabela contents (AC-030)

CREATE TABLE IF NOT EXISTS contents (
    id SERIAL PRIMARY KEY,
    materia VARCHAR(255) NOT NULL,
    topico   VARCHAR(255) NOT NULL,
    UNIQUE(materia, topico)
);

ALTER TABLE questions ADD COLUMN IF NOT EXISTS content_id INT REFERENCES contents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_questions_content ON questions(content_id);

INSERT INTO contents (materia, topico) VALUES
-- Banco de Dados (Relacional, NoSQL, Vetorial)
('Banco de Dados (Relacional, NoSQL, Vetorial)', 'Modelagem ER, normalizacao e desnormalizacao'),
('Banco de Dados (Relacional, NoSQL, Vetorial)', 'SQL, algebra relacional e transacoes ACID'),
('Banco de Dados (Relacional, NoSQL, Vetorial)', 'Indices e otimizacao de consultas'),
('Banco de Dados (Relacional, NoSQL, Vetorial)', 'Procedures, triggers e views'),
('Banco de Dados (Relacional, NoSQL, Vetorial)', 'PostgreSQL e Oracle: administracao'),
('Banco de Dados (Relacional, NoSQL, Vetorial)', 'NoSQL: documentos, chave-valor, wide-column, grafos'),
('Banco de Dados (Relacional, NoSQL, Vetorial)', 'Bancos vetoriais e embeddings'),
('Banco de Dados (Relacional, NoSQL, Vetorial)', 'Replicacao, backup, HA e governanca'),

-- Engenharia de Software e Desenvolvimento
-- (absorve: Engenharia de Software + Desenvolvimento de Sistemas + DevOps e Entrega)
('Engenharia de Software e Desenvolvimento', 'Fundamentos e ciclo de vida'),
('Engenharia de Software e Desenvolvimento', 'Ageis: Scrum, Kanban, XP, Lean'),
('Engenharia de Software e Desenvolvimento', 'Requisitos e historias de usuario'),
('Engenharia de Software e Desenvolvimento', 'Arquitetura: camadas, SOA, microsservicos, eventos'),
('Engenharia de Software e Desenvolvimento', 'Principios SOLID, DRY, KISS, YAGNI'),
('Engenharia de Software e Desenvolvimento', 'UML e BPMN'),
('Engenharia de Software e Desenvolvimento', 'Design Patterns (criacionais, estruturais, comportamentais)'),
('Engenharia de Software e Desenvolvimento', 'Qualidade, testes e refatoracao'),
('Engenharia de Software e Desenvolvimento', 'Algoritmos, logica e estruturas de dados'),
('Engenharia de Software e Desenvolvimento', 'POO e programacao funcional'),
('Engenharia de Software e Desenvolvimento', 'Java, JavaScript, Node.js, Python'),
('Engenharia de Software e Desenvolvimento', 'React e desenvolvimento front-end'),
('Engenharia de Software e Desenvolvimento', 'APIs RESTful, GraphQL, WebSockets'),
('Engenharia de Software e Desenvolvimento', 'Autenticacao: OAuth 2.0, OIDC, JWT'),
('Engenharia de Software e Desenvolvimento', 'HTML5, CSS3, TypeScript'),
('Engenharia de Software e Desenvolvimento', 'Git e documentacao de APIs'),
('Engenharia de Software e Desenvolvimento', 'CI/CD e pipelines de automacao'),
('Engenharia de Software e Desenvolvimento', 'Infraestrutura como codigo e configuracao'),
('Engenharia de Software e Desenvolvimento', 'Observabilidade: metricas, logs, traces'),
('Engenharia de Software e Desenvolvimento', 'Git Flow, trunk-based, pull requests'),
('Engenharia de Software e Desenvolvimento', 'Docker, Docker Compose e Kubernetes'),
('Engenharia de Software e Desenvolvimento', 'GitHub Actions, GitLab CI/CD, Jenkins'),

-- Governança de TI e Contratações TIC
-- (absorve: Governanca de TI + Legislacao e Normativos)
('Governança de TI e Contratações TIC', 'COBIT 2019, ITIL v4, ISO/IEC 38500:2024'),
('Governança de TI e Contratações TIC', 'Gestao de servicos: incidentes, problemas, mudancas'),
('Governança de TI e Contratações TIC', 'Gestao de projetos: PMBOK 8a ed. e metodos ageis'),
('Governança de TI e Contratações TIC', 'Contratacoes TIC (Lei 14.133/2021)'),
('Governança de TI e Contratações TIC', 'Governo digital: Lei 14.129/2021 e ENGD 2024-2027'),
('Governança de TI e Contratações TIC', 'LGPD (Lei 13.709/2018): privacy by design, minimizacao, anonimizacao'),
('Governança de TI e Contratações TIC', 'Marco Civil da Internet (Lei 12.965/2014)'),
('Governança de TI e Contratações TIC', 'Certificacao digital'),
('Governança de TI e Contratações TIC', 'LC estadual 205/2025'),
('Governança de TI e Contratações TIC', 'Normativos TCE-GO: RN 13/2016, RA 14/2024, RA 17/2024, RA 14/2025, PDTI 2025-2026'),

-- IA, Ciência de Dados e Automação
-- (absorve: IA, Ciencia de Dados e Automacao + IA Assistida e Sistemas Agentivos)
('IA, Ciência de Dados e Automação', 'Aprendizado de maquina: supervisionado, nao supervisionado, reforco'),
('IA, Ciência de Dados e Automação', 'Redes neurais e deep learning'),
('IA, Ciência de Dados e Automação', 'PLN e IA generativa'),
('IA, Ciência de Dados e Automação', 'Agentes inteligentes e modelos multimodais'),
('IA, Ciência de Dados e Automação', 'Ciencia de dados e Big Data'),
('IA, Ciência de Dados e Automação', 'Etica em IA, LGPD e Estrategia Brasileira de IA'),
('IA, Ciência de Dados e Automação', 'LLMs e programacao baseada em intencao'),
('IA, Ciência de Dados e Automação', 'Engenharia de prompts e de contexto'),
('IA, Ciência de Dados e Automação', 'Ciclo agentivo e ferramentas (Claude Code, AGY CLI)'),
('IA, Ciência de Dados e Automação', 'RAG e bancos vetoriais'),
('IA, Ciência de Dados e Automação', 'MCP e extensibilidade (skills/tool use)'),
('IA, Ciência de Dados e Automação', 'Avaliacao de codigo IA, etica e privacidade'),

-- Língua Inglesa (Leitura Técnica)
('Língua Inglesa (Leitura Técnica)', 'Compreensao de textos tecnicos em ingles'),
('Língua Inglesa (Leitura Técnica)', 'Vocabulario tecnico de TI'),

-- Segurança da Informação
('Segurança da Informação', 'Principios CIA, autenticidade e nao repudio'),
('Segurança da Informação', 'Gestao de riscos, vulnerabilidades e incidentes'),
('Segurança da Informação', 'Controle de acesso e IAM'),
('Segurança da Informação', 'Criptografia simetrica, assimetrica e PKI'),
('Segurança da Informação', 'OWASP Top 10:2025 e DevSecOps'),
('Segurança da Informação', 'Backup, continuidade e recuperacao de desastres'),
('Segurança da Informação', 'Malware, phishing, firewalls, IDS/IPS, Zero Trust'),
('Segurança da Informação', 'ISO/IEC 27000'),

-- Sistemas Operacionais, Redes e Nuvem
('Sistemas Operacionais, Redes e Nuvem', 'Administracao Windows e Linux'),
('Sistemas Operacionais, Redes e Nuvem', 'Shell scripting (Linux e PowerShell)'),
('Sistemas Operacionais, Redes e Nuvem', 'Active Directory e LDAP'),
('Sistemas Operacionais, Redes e Nuvem', 'TCP/IP, IPv4, IPv6, DNS, DHCP'),
('Sistemas Operacionais, Redes e Nuvem', 'Protocolos: HTTP/2, HTTP/3, HTTPS, SMTP, FTP, SSH'),
('Sistemas Operacionais, Redes e Nuvem', 'VPN, balanceamento de carga, proxies, firewalls, Wi-Fi'),
('Sistemas Operacionais, Redes e Nuvem', 'Nuvem: IaaS, PaaS, SaaS, serverless, escalabilidade')

ON CONFLICT (materia, topico) DO NOTHING;
