"""
Configuracao canonica do edital TCE-GO - Analista de TI.

Este arquivo e a fonte de verdade para:
1. Filtro de cargos relevantes no scraping (CARGO_KEYWORDS)
2. Materias e topicos do edital (EDITAL_CONTENTS)
3. Prompt de classificacao enviado ao Gemini

Qualquer alteracao no edital deve ser refletida aqui E na tabela `contents` do banco.
"""

# ---------------------------------------------------------------------------
# Keywords para filtrar cargos de TI nas provas scrapeadas
# ---------------------------------------------------------------------------
CARGO_KEYWORDS = [
    "analista de tecnologia",
    "analista de ti",
    "analista de sistemas",
    "analista de informatica",
    "analista de infraestrutura",
    "analista de suporte",
    "analista de seguranca",
    "analista de banco de dados",
    "analista de desenvolvimento",
    "analista de redes",
    "analista judiciario - tecnologia",
    "analista judiciario - informatica",
    "analista judiciario - sistemas",
    "analista ministerial - informatica",
    "tecnico de informatica",
    "tecnico de tecnologia",
    "tecnologia da informacao",
    "processamento de dados",
    "informatica",
    "agente da fiscalizacao financeira informatica",
    "auditor fiscal - tecnologia",
    "auditor de controle externo - tecnologia",
    "auditor de controle externo - informatica",
    "especialista em tecnologia",
    "programador",
    "desenvolvedor",
    "administrador de banco de dados",
    "administrador de rede",
    "ciencia de dados",
    "seguranca da informacao",
    "governanca de ti",
]

# ---------------------------------------------------------------------------
# Conteudo programatico completo do edital (materia -> topicos)
# Deve estar sincronizado com a tabela `contents` do banco de dados.
# ---------------------------------------------------------------------------
EDITAL_CONTENTS: dict[str, list[str]] = {
    "Banco de Dados (Relacional, NoSQL, Vetorial)": [
        "Modelagem ER, normalizacao e desnormalizacao",
        "SQL, algebra relacional e transacoes ACID",
        "Indices e otimizacao de consultas",
        "Procedures, triggers e views",
        "PostgreSQL e Oracle: administracao",
        "NoSQL: documentos, chave-valor, wide-column, grafos",
        "Bancos vetoriais e embeddings",
        "Replicacao, backup, HA e governanca",
    ],
    "Engenharia de Software e Desenvolvimento": [
        "Fundamentos e ciclo de vida",
        "Ageis: Scrum, Kanban, XP, Lean",
        "Requisitos e historias de usuario",
        "Arquitetura: camadas, SOA, microsservicos, eventos",
        "Principios SOLID, DRY, KISS, YAGNI",
        "UML e BPMN",
        "Design Patterns (criacionais, estruturais, comportamentais)",
        "Qualidade, testes e refatoracao",
        "Algoritmos, logica e estruturas de dados",
        "POO e programacao funcional",
        "Java, JavaScript, Node.js, Python",
        "React e desenvolvimento front-end",
        "APIs RESTful, GraphQL, WebSockets",
        "Autenticacao: OAuth 2.0, OIDC, JWT",
        "HTML5, CSS3, TypeScript",
        "Git e documentacao de APIs",
        "CI/CD e pipelines de automacao",
        "Infraestrutura como codigo e configuracao",
        "Observabilidade: metricas, logs, traces",
        "Git Flow, trunk-based, pull requests",
        "Docker, Docker Compose e Kubernetes",
        "GitHub Actions, GitLab CI/CD, Jenkins",
    ],
    "Governança de TI e Contratações TIC": [
        "COBIT 2019, ITIL v4, ISO/IEC 38500:2024",
        "Gestao de servicos: incidentes, problemas, mudancas",
        "Gestao de projetos: PMBOK 8a ed. e metodos ageis",
        "Contratacoes TIC (Lei 14.133/2021)",
        "Governo digital: Lei 14.129/2021 e ENGD 2024-2027",
        "LGPD (Lei 13.709/2018): privacy by design, minimizacao, anonimizacao",
        "Marco Civil da Internet (Lei 12.965/2014)",
        "Certificacao digital",
        "LC estadual 205/2025",
        "Normativos TCE-GO: RN 13/2016, RA 14/2024, RA 17/2024, RA 14/2025, PDTI 2025-2026",
    ],
    "IA, Ciência de Dados e Automação": [
        "Aprendizado de maquina: supervisionado, nao supervisionado, reforco",
        "Redes neurais e deep learning",
        "PLN e IA generativa",
        "Agentes inteligentes e modelos multimodais",
        "Ciencia de dados e Big Data",
        "Etica em IA, LGPD e Estrategia Brasileira de IA",
        "LLMs e programacao baseada em intencao",
        "Engenharia de prompts e de contexto",
        "Ciclo agentivo e ferramentas (Claude Code, AGY CLI)",
        "RAG e bancos vetoriais",
        "MCP e extensibilidade (skills/tool use)",
        "Avaliacao de codigo IA, etica e privacidade",
    ],
    "Língua Inglesa (Leitura Técnica)": [
        "Compreensao de textos tecnicos em ingles",
        "Vocabulario tecnico de TI",
    ],
    "Segurança da Informação": [
        "Principios CIA, autenticidade e nao repudio",
        "Gestao de riscos, vulnerabilidades e incidentes",
        "Controle de acesso e IAM",
        "Criptografia simetrica, assimetrica e PKI",
        "OWASP Top 10:2025 e DevSecOps",
        "Backup, continuidade e recuperacao de desastres",
        "Malware, phishing, firewalls, IDS/IPS, Zero Trust",
        "ISO/IEC 27000",
    ],
    "Sistemas Operacionais, Redes e Nuvem": [
        "Administracao Windows e Linux",
        "Shell scripting (Linux e PowerShell)",
        "Active Directory e LDAP",
        "TCP/IP, IPv4, IPv6, DNS, DHCP",
        "Protocolos: HTTP/2, HTTP/3, HTTPS, SMTP, FTP, SSH",
        "VPN, balanceamento de carga, proxies, firewalls, Wi-Fi",
        "Nuvem: IaaS, PaaS, SaaS, serverless, escalabilidade",
    ],
}


def get_contents_json() -> str:
    """Retorna o JSON da lista canonica materia/topico para enviar ao Gemini."""
    import json
    contents_list = []
    for materia, topicos in EDITAL_CONTENTS.items():
        for topico in topicos:
            contents_list.append({"materia": materia, "topico": topico})
    return json.dumps(contents_list, ensure_ascii=False)


def matches_cargo_keyword(cargo_text: str) -> bool:
    """Verifica se o texto do cargo contem keywords de TI."""
    cargo_lower = cargo_text.lower().strip()
    return any(kw in cargo_lower for kw in CARGO_KEYWORDS)
