-- Migration: unificar nomes de materia da tabela contents com os modulos canonicos

-- Remove constraint para permitir renomear sem conflito de unicidade durante a transicao
ALTER TABLE contents DROP CONSTRAINT IF EXISTS contents_materia_topico_key;

-- 1. Banco de Dados -> Banco de Dados (Relacional, NoSQL, Vetorial)
UPDATE contents SET materia = 'Banco de Dados (Relacional, NoSQL, Vetorial)'
  WHERE materia = 'Banco de Dados';

-- 2. Engenharia de Software, Desenvolvimento de Sistemas, DevOps e Entrega
--    -> Engenharia de Software e Desenvolvimento
UPDATE contents SET materia = 'Engenharia de Software e Desenvolvimento'
  WHERE materia IN ('Engenharia de Software', 'Desenvolvimento de Sistemas', 'DevOps e Entrega');

-- 3. Governanca de TI, Legislacao e Normativos
--    -> Governança de TI e Contratações TIC
UPDATE contents SET materia = 'Governança de TI e Contratações TIC'
  WHERE materia IN ('Governanca de TI', 'Legislacao e Normativos');

-- 4. IA, Ciencia de Dados e Automacao, IA Assistida e Sistemas Agentivos
--    -> IA, Ciência de Dados e Automação
UPDATE contents SET materia = 'IA, Ciência de Dados e Automação'
  WHERE materia IN ('IA, Ciencia de Dados e Automacao', 'IA Assistida e Sistemas Agentivos');

-- 5. Lingua Inglesa -> Língua Inglesa (Leitura Técnica)
UPDATE contents SET materia = 'Língua Inglesa (Leitura Técnica)'
  WHERE materia = 'Lingua Inglesa';

-- 6. Seguranca da Informacao -> Segurança da Informação
UPDATE contents SET materia = 'Segurança da Informação'
  WHERE materia = 'Seguranca da Informacao';

-- Remove duplicatas geradas pela fusao (mantém o de menor id)
DELETE FROM contents a USING contents b
  WHERE a.id > b.id AND a.materia = b.materia AND a.topico = b.topico;

-- Reabilita a constraint de unicidade
ALTER TABLE contents ADD CONSTRAINT contents_materia_topico_key UNIQUE (materia, topico);

-- Insere topicos novos (os que nao existiam antes da consolidacao)
INSERT INTO contents (materia, topico) VALUES
('Engenharia de Software e Desenvolvimento', 'CI/CD e pipelines de automacao'),
('Engenharia de Software e Desenvolvimento', 'Infraestrutura como codigo e configuracao'),
('Engenharia de Software e Desenvolvimento', 'Observabilidade: metricas, logs, traces'),
('Engenharia de Software e Desenvolvimento', 'Git Flow, trunk-based, pull requests'),
('Engenharia de Software e Desenvolvimento', 'Docker, Docker Compose e Kubernetes'),
('Engenharia de Software e Desenvolvimento', 'GitHub Actions, GitLab CI/CD, Jenkins'),
('Governança de TI e Contratações TIC', 'LGPD (Lei 13.709/2018): privacy by design, minimizacao, anonimizacao'),
('Governança de TI e Contratações TIC', 'Marco Civil da Internet (Lei 12.965/2014)'),
('Governança de TI e Contratações TIC', 'Certificacao digital'),
('Governança de TI e Contratações TIC', 'LC estadual 205/2025'),
('Governança de TI e Contratações TIC', 'Normativos TCE-GO: RN 13/2016, RA 14/2024, RA 17/2024, RA 14/2025, PDTI 2025-2026'),
('IA, Ciência de Dados e Automação', 'LLMs e programacao baseada em intencao'),
('IA, Ciência de Dados e Automação', 'Engenharia de prompts e de contexto'),
('IA, Ciência de Dados e Automação', 'Ciclo agentivo e ferramentas (Claude Code, AGY CLI)'),
('IA, Ciência de Dados e Automação', 'RAG e bancos vetoriais'),
('IA, Ciência de Dados e Automação', 'MCP e extensibilidade (skills/tool use)'),
('IA, Ciência de Dados e Automação', 'Avaliacao de codigo IA, etica e privacidade')
ON CONFLICT (materia, topico) DO NOTHING;
