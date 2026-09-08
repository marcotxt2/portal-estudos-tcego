--
-- PostgreSQL database dump
--

\restrict lf2bFhSalZqg5ibn6ZNdydA5msLkRPS6wppBUTM71zBpnfiBSo8e2DV3pDfKU1x

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_progress DROP CONSTRAINT IF EXISTS user_progress_question_id_fkey;
ALTER TABLE IF EXISTS ONLY public.theories DROP CONSTRAINT IF EXISTS theories_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_related_theory_id_fkey;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_content_id_fkey;
DROP INDEX IF EXISTS public.ix_users_username;
DROP INDEX IF EXISTS public.ix_users_id;
DROP INDEX IF EXISTS public.idx_user_progress_question;
DROP INDEX IF EXISTS public.idx_questions_module;
DROP INDEX IF EXISTS public.idx_questions_content;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_progress DROP CONSTRAINT IF EXISTS user_progress_pkey;
ALTER TABLE IF EXISTS ONLY public.upload_tasks DROP CONSTRAINT IF EXISTS upload_tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.theories DROP CONSTRAINT IF EXISTS theories_pkey;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_pkey;
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS modules_pkey;
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS modules_name_key;
ALTER TABLE IF EXISTS ONLY public.contents DROP CONSTRAINT IF EXISTS contents_pkey;
ALTER TABLE IF EXISTS ONLY public.contents DROP CONSTRAINT IF EXISTS contents_materia_topico_key;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_progress ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.theories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.questions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.modules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.contents ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_progress_id_seq;
DROP TABLE IF EXISTS public.user_progress;
DROP TABLE IF EXISTS public.upload_tasks;
DROP SEQUENCE IF EXISTS public.theories_id_seq;
DROP TABLE IF EXISTS public.theories;
DROP SEQUENCE IF EXISTS public.questions_id_seq;
DROP TABLE IF EXISTS public.questions;
DROP SEQUENCE IF EXISTS public.modules_id_seq;
DROP TABLE IF EXISTS public.modules;
DROP SEQUENCE IF EXISTS public.contents_id_seq;
DROP TABLE IF EXISTS public.contents;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contents; Type: TABLE; Schema: public; Owner: portal_user
--

CREATE TABLE public.contents (
    id integer NOT NULL,
    materia character varying(255) NOT NULL,
    topico character varying(255) NOT NULL
);


ALTER TABLE public.contents OWNER TO portal_user;

--
-- Name: contents_id_seq; Type: SEQUENCE; Schema: public; Owner: portal_user
--

CREATE SEQUENCE public.contents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contents_id_seq OWNER TO portal_user;

--
-- Name: contents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: portal_user
--

ALTER SEQUENCE public.contents_id_seq OWNED BY public.contents.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: portal_user
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    day_of_week integer NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.modules OWNER TO portal_user;

--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: portal_user
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_id_seq OWNER TO portal_user;

--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: portal_user
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: portal_user
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    module_id integer,
    statement text NOT NULL,
    options jsonb NOT NULL,
    correct_option character(1) NOT NULL,
    related_theory_id integer,
    related_theory_text text,
    explanation text,
    is_ai_generated boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    content_id integer
);


ALTER TABLE public.questions OWNER TO portal_user;

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: portal_user
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_id_seq OWNER TO portal_user;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: portal_user
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: theories; Type: TABLE; Schema: public; Owner: portal_user
--

CREATE TABLE public.theories (
    id integer NOT NULL,
    module_id integer,
    title character varying(255) NOT NULL,
    content_markdown text NOT NULL,
    topic_tag character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.theories OWNER TO portal_user;

--
-- Name: theories_id_seq; Type: SEQUENCE; Schema: public; Owner: portal_user
--

CREATE SEQUENCE public.theories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.theories_id_seq OWNER TO portal_user;

--
-- Name: theories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: portal_user
--

ALTER SEQUENCE public.theories_id_seq OWNED BY public.theories.id;


--
-- Name: upload_tasks; Type: TABLE; Schema: public; Owner: portal_user
--

CREATE TABLE public.upload_tasks (
    id character varying(36) NOT NULL,
    filename character varying(255) NOT NULL,
    module_name character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    total_chunks integer DEFAULT 0 NOT NULL,
    processed_chunks integer DEFAULT 0 NOT NULL,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.upload_tasks OWNER TO portal_user;

--
-- Name: user_progress; Type: TABLE; Schema: public; Owner: portal_user
--

CREATE TABLE public.user_progress (
    id integer NOT NULL,
    question_id integer,
    chosen_option character(1) NOT NULL,
    is_correct boolean NOT NULL,
    answered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer
);


ALTER TABLE public.user_progress OWNER TO portal_user;

--
-- Name: user_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: portal_user
--

CREATE SEQUENCE public.user_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_progress_id_seq OWNER TO portal_user;

--
-- Name: user_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: portal_user
--

ALTER SEQUENCE public.user_progress_id_seq OWNED BY public.user_progress.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: portal_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO portal_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: portal_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO portal_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: portal_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: contents id; Type: DEFAULT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.contents ALTER COLUMN id SET DEFAULT nextval('public.contents_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: theories id; Type: DEFAULT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.theories ALTER COLUMN id SET DEFAULT nextval('public.theories_id_seq'::regclass);


--
-- Name: user_progress id; Type: DEFAULT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.user_progress ALTER COLUMN id SET DEFAULT nextval('public.user_progress_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: contents; Type: TABLE DATA; Schema: public; Owner: portal_user
--

COPY public.contents (id, materia, topico) FROM stdin;
51	Sistemas Operacionais, Redes e Nuvem	Administracao Windows e Linux
52	Sistemas Operacionais, Redes e Nuvem	Shell scripting (Linux e PowerShell)
53	Sistemas Operacionais, Redes e Nuvem	Active Directory e LDAP
54	Sistemas Operacionais, Redes e Nuvem	TCP/IP, IPv4, IPv6, DNS, DHCP
55	Sistemas Operacionais, Redes e Nuvem	Protocolos: HTTP/2, HTTP/3, HTTPS, SMTP, FTP, SSH
56	Sistemas Operacionais, Redes e Nuvem	VPN, balanceamento de carga, proxies, firewalls, Wi-Fi
57	Sistemas Operacionais, Redes e Nuvem	Nuvem: IaaS, PaaS, SaaS, serverless, escalabilidade
29	Banco de Dados (Relacional, NoSQL, Vetorial)	Modelagem ER, normalizacao e desnormalizacao
30	Banco de Dados (Relacional, NoSQL, Vetorial)	SQL, algebra relacional e transacoes ACID
31	Banco de Dados (Relacional, NoSQL, Vetorial)	Indices e otimizacao de consultas
32	Banco de Dados (Relacional, NoSQL, Vetorial)	Procedures, triggers e views
33	Banco de Dados (Relacional, NoSQL, Vetorial)	PostgreSQL e Oracle: administracao
34	Banco de Dados (Relacional, NoSQL, Vetorial)	NoSQL: documentos, chave-valor, wide-column, grafos
35	Banco de Dados (Relacional, NoSQL, Vetorial)	Bancos vetoriais e embeddings
36	Banco de Dados (Relacional, NoSQL, Vetorial)	Replicacao, backup, HA e governanca
1	Engenharia de Software e Desenvolvimento	Fundamentos e ciclo de vida
2	Engenharia de Software e Desenvolvimento	Ageis: Scrum, Kanban, XP, Lean
3	Engenharia de Software e Desenvolvimento	Requisitos e historias de usuario
4	Engenharia de Software e Desenvolvimento	Arquitetura: camadas, SOA, microsservicos, eventos
5	Engenharia de Software e Desenvolvimento	Principios SOLID, DRY, KISS, YAGNI
6	Engenharia de Software e Desenvolvimento	UML e BPMN
7	Engenharia de Software e Desenvolvimento	Design Patterns (criacionais, estruturais, comportamentais)
8	Engenharia de Software e Desenvolvimento	Qualidade, testes e refatoracao
9	Engenharia de Software e Desenvolvimento	Algoritmos, logica e estruturas de dados
17	IA, Ciência de Dados e Automação	LLMs e programacao baseada em intencao
18	IA, Ciência de Dados e Automação	Engenharia de prompts e de contexto
19	IA, Ciência de Dados e Automação	Ciclo agentivo e ferramentas (Claude Code, AGY CLI)
20	IA, Ciência de Dados e Automação	RAG e bancos vetoriais
21	IA, Ciência de Dados e Automação	MCP e extensibilidade (skills/tool use)
22	IA, Ciência de Dados e Automação	Avaliacao de codigo IA, etica e privacidade
37	IA, Ciência de Dados e Automação	Aprendizado de maquina: supervisionado, nao supervisionado, reforco
68	Língua Inglesa (Leitura Técnica)	Compreensao de textos tecnicos em ingles
69	Língua Inglesa (Leitura Técnica)	Vocabulario tecnico de TI
43	Segurança da Informação	Principios CIA, autenticidade e nao repudio
58	Governança de TI e Contratações TIC	COBIT 2019, ITIL v4, ISO/IEC 38500:2024
59	Governança de TI e Contratações TIC	Gestao de servicos: incidentes, problemas, mudancas
60	Governança de TI e Contratações TIC	Gestao de projetos: PMBOK 8a ed. e metodos ageis
61	Governança de TI e Contratações TIC	Contratacoes TIC (Lei 14.133/2021)
62	Governança de TI e Contratações TIC	Governo digital: Lei 14.129/2021 e ENGD 2024-2027
63	Governança de TI e Contratações TIC	LGPD (Lei 13.709/2018): privacy by design, minimizacao, anonimizacao
64	Governança de TI e Contratações TIC	Marco Civil da Internet (Lei 12.965/2014)
65	Governança de TI e Contratações TIC	Certificacao digital
66	Governança de TI e Contratações TIC	LC estadual 205/2025
67	Governança de TI e Contratações TIC	Normativos TCE-GO: RN 13/2016, RA 14/2024, RA 17/2024, RA 14/2025, PDTI 2025-2026
44	Segurança da Informação	Gestao de riscos, vulnerabilidades e incidentes
45	Segurança da Informação	Controle de acesso e IAM
46	Segurança da Informação	Criptografia simetrica, assimetrica e PKI
47	Segurança da Informação	OWASP Top 10:2025 e DevSecOps
48	Segurança da Informação	Backup, continuidade e recuperacao de desastres
49	Segurança da Informação	Malware, phishing, firewalls, IDS/IPS, Zero Trust
50	Segurança da Informação	ISO/IEC 27000
10	Engenharia de Software e Desenvolvimento	POO e programacao funcional
11	Engenharia de Software e Desenvolvimento	Java, JavaScript, Node.js, Python
12	Engenharia de Software e Desenvolvimento	React e desenvolvimento front-end
13	Engenharia de Software e Desenvolvimento	APIs RESTful, GraphQL, WebSockets
14	Engenharia de Software e Desenvolvimento	Autenticacao: OAuth 2.0, OIDC, JWT
15	Engenharia de Software e Desenvolvimento	HTML5, CSS3, TypeScript
16	Engenharia de Software e Desenvolvimento	Git e documentacao de APIs
23	Engenharia de Software e Desenvolvimento	CI/CD e pipelines de automacao
24	Engenharia de Software e Desenvolvimento	Infraestrutura como codigo e configuracao
25	Engenharia de Software e Desenvolvimento	Observabilidade: metricas, logs, traces
26	Engenharia de Software e Desenvolvimento	Git Flow, trunk-based, pull requests
27	Engenharia de Software e Desenvolvimento	Docker, Docker Compose e Kubernetes
28	Engenharia de Software e Desenvolvimento	GitHub Actions, GitLab CI/CD, Jenkins
38	IA, Ciência de Dados e Automação	Redes neurais e deep learning
39	IA, Ciência de Dados e Automação	PLN e IA generativa
40	IA, Ciência de Dados e Automação	Agentes inteligentes e modelos multimodais
41	IA, Ciência de Dados e Automação	Ciencia de dados e Big Data
42	IA, Ciência de Dados e Automação	Etica em IA, LGPD e Estrategia Brasileira de IA
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: portal_user
--

COPY public.modules (id, name, day_of_week, description, created_at) FROM stdin;
1	Governança de TI e Contratações TIC	0	\N	2026-09-08 14:11:53.291497
2	Engenharia de Software e Desenvolvimento	1	\N	2026-09-08 14:11:53.291497
3	Segurança da Informação	2	\N	2026-09-08 14:11:53.291497
4	Sistemas Operacionais, Redes e Nuvem	3	\N	2026-09-08 14:11:53.291497
5	IA, Ciência de Dados e Automação	4	\N	2026-09-08 14:11:53.291497
6	Banco de Dados (Relacional, NoSQL, Vetorial)	5	\N	2026-09-08 14:11:53.291497
7	Língua Inglesa (Leitura Técnica)	6	\N	2026-09-08 14:11:53.291497
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: portal_user
--

COPY public.questions (id, module_id, statement, options, correct_option, related_theory_id, related_theory_text, explanation, is_ai_generated, created_at, content_id) FROM stdin;
1	4	(FGV - TCE-SP - Agente (Superior) – 2023) Um determinado roteador está interligando diversos enlaces, cada um rodando diferentes protocolos da camada de enlace com diferentes MTUs. Ao receber um datagrama IPv4 de um enlace, o roteador identificou que o enlace de saída tem uma MTU menor do que o comprimento do datagrama IP.\n\nNesse cenário, o roteador deve:	{"A": "descartar o datagrama IP e solicitar à origem que envie novamente o datagrama com a MTU correta;", "B": "descartar o datagrama IP, alterar a MTU do enlace e solicitar à origem que envie novamente o datagrama;", "C": "ajustar a MTU do enlace de saída, igualando à MTU do enlace de entrada, para suportar o datagrama IP enviado e os demais com mesmo tamanho;", "D": "fragmentar os dados do datagrama IP em dois ou mais datagramas IP menores e reconstruí-los utilizando os campos ID, Deslocamento e Flag;", "E": "fragmentar os dados do datagrama IP em dois ou mais datagramas IP menores e reconstruí-los utilizando os campos ID, Deslocamento e TTL."}	D	\N	\N	Quando um datagrama IPv4 excede a MTU do enlace de saída, o roteador realiza a fragmentação em partes menores, utilizando os campos de Identificação, Deslocamento e Flags para permitir a remontagem no destino. As demais alternativas estão incorretas pois o IPv4 suporta fragmentação em roteadores, os campos TTL (Time to Live) servem para controle de loop e contagem de saltos, e as MTUs dependem das características físicas dos enlaces.	f	2026-09-08 15:42:59.75364	54
2	4	(CESPE / CEBRASPE - Ministério da Economia - Tecnologia da Informação - 2020) Julgue o item subsecutivo, com relação a modelo de referência OSI e TCP/IP.\n\nAs camadas de rede e de enlace pertencem tanto ao TCP/IP quanto ao modelo OSI, e, em ambos, ainda que elas trabalhem em conjunto para transmitir os datagramas, a camada de rede independe dos serviços da camada de enlace, pois, por meio de uma série de roteadores entre a origem e o destino, a camada de rede passa os datagramas para a de enlace a cada nó.	{"C": "Certo", "E": "Errado"}	E	\N	\N	O item está errado porque, na arquitetura TCP/IP, as funções da camada de enlace e da camada física muitas vezes não formam camadas rígidas padronizadas da mesma forma que no modelo OSI (onde a camada de rede IP opera sobre qualquer protocolo de enlace subjacente de forma independente, mas a afirmação contém pegadinha estrutural ou conceitual tratada como errada pela banca). A alternativa correta é Errado.	f	2026-09-08 15:42:59.75364	54
3	4	(CESPE / CEBRASPE - CTI - Tecnologista Júnior - 2024) Com relação à administração de rede de dados, julgue o item a seguir.\n\nEm uma rede TCP/IP, o endereçamento IP é responsável pela identificação única de cada dispositivo na rede.	{"C": "Certo", "E": "Errado"}	C	\N	\N	O endereçamento IP (IPv4 ou IPv6) atua na camada de rede fornecendo a identificação lógica e única para cada dispositivo conectado a uma rede TCP/IP, permitindo o roteamento de pacotes entre diferentes redes.	f	2026-09-08 15:42:59.75364	54
4	4	(CESPE / CEBRASPE - DATAPREV - Assistente de Tecnologia da Informação - 2023) A respeito de arquitetura de rede TCP/IP, julgue o item a seguir.\n\nO IPv4 funciona como identificador de 64 bits utilizado para identificar dispositivos em uma rede.	{"C": "Certo", "E": "Errado"}	E	\N	\N	O item está errado pois o endereçamento IPv4 utiliza um identificador de 32 bits (dividido em 4 octetos), e não de 64 bits (tamanho associado a outras arquiteturas ou versões futuras/específicas).	f	2026-09-08 15:42:59.75364	54
5	4	(VUNESP - Prefeitura de Guararapes - SP - Técnico de Informática - 2023) Tratando-se da composição do cabeçalho IPv4, pode-se dizer que ele é:	{"A": "composto por 8 campos e tamanho fixo de bytes.", "B": "composto por cabeçalhos de extensão com tamanho dinâmico e variado de bytes.", "C": "composto por 12 campos fixos com um tamanho variado entre 20 e 60 bytes.", "D": "composto por 16 campos variáveis de informação contendo 32 bytes fixos em cada campo.", "E": "composto por 256 bytes de cabeçalho em 24 campos fixos de informação."}	C	\N	\N	O cabeçalho IPv4 padrão possui 12 campos obrigatórios/fixos e pode incluir opções, resultando em um tamanho que varia de 20 a 60 bytes. As demais alternativas descrevem incorretamente a estrutura ou tamanho do cabeçalho IPv4.	f	2026-09-08 15:42:59.75364	54
6	4	(FGV - AL-MA - Analista - Suporte de Informática – 2023) Assinale a opção que corresponde ao valor binário resultante da conversão do endereço IP 192.168.10.50:	{"A": "11000010.10101000.00001010.00110010", "B": "11000010.10101010.00001010.00110010", "C": "11000000.10101000.00001010.00110011", "D": "11000000.10101000.00001010.00110010", "E": "11000000.10101010.00001010.00110011"}	D	\N	\N	Convertendo cada octeto do endereço IP 192.168.10.50 para binário temos: 192 = 11000000, 168 = 10101000, 10 = 00001010 e 50 = 00110010, o que corresponde exatamente à alternativa D. As demais alternativas apresentam conversões incorretas de um ou mais octetos do endereço IP.	f	2026-09-08 15:43:08.892893	54
7	4	(FCC - TRT - 19ª Região (AL) - Analista Judiciário - Tecnologia da Informação – 2022) No IPv4, em um endereço classe C (/24), é possível definir, no máximo,	{"A": "256 redes.", "B": "2048 redes.", "C": "215 redes.", "D": "221 redes.", "E": "242 redes."}	D	\N	\N	Em endereços IPv4 de Classe C, os primeiros 3 bits são fixados em 110, restando 21 bits para a identificação de redes, o que resulta em um total de 2^21 redes possíveis. As demais alternativas indicam valores incorretos de bits ou de redes para a classe C padrão descrita.	f	2026-09-08 15:43:08.892893	54
8	4	(CESPE / CEBRASPE - Telebras - Engenheiro de redes de comunicação - 2022) Com relação ao endereçamento IP e ao roteamento, julgue o item subsequente.\n\nOs endereços inseridos em um intervalo de 0.0.0.0 a 129.0.0.0 integram exclusivamente a classe A.	{"C": "Certo", "E": "Errado"}	E	\N	\N	O item está errado porque a classe A abrange o intervalo de 0.0.0.0 a 127.255.255.255, enquanto o endereço 129.0.0.0 já pertence à classe B (cujo intervalo válido inicia em 128.0.0.0). Portanto, os endereços informados não integram exclusivamente a classe A.	f	2026-09-08 15:43:16.303916	54
9	4	(CESPE / CEBRASPE - TJ-RJ - Analista Judiciário - Tecnologia da Informação - 2021) Como uma solução temporária para o esgotamento do espaço de endereços IP, a Request for Comments 1918 (RFC 1918) adotou o emprego de endereços IP privados, nas classes A, B e C. Assinale a opção que apresenta a notação CIDR para o bloco de endereço IP privado da classe B.	{"A": "172.16.0.0/9", "B": "172.16.0.0/10", "C": "172.16.0.0/11", "D": "172.16.0.0/12", "E": "172.16.0.0/13"}	D	\N	\N	O bloco de endereços IP privados da classe B definido pela RFC 1918 compreende a faixa de 172.16.0.0 a 172.31.255.255, o que corresponde a 16 redes contíguas de Classe B agrupadas sob a máscara de sub-rede /12. As demais opções utilizam prefixos CIDR incorretos para essa faixa específica.	f	2026-09-08 15:43:16.303916	54
10	4	(VUNESP - Prefeitura de Guararapes - SP - Técnico de Informática – 2023) Ao iniciar o processo de verificação e cálculo de máscaras de sub-rede, a máscara: 255.255.254.0/23 pode conter até quantos hosts/sub-redes, levando-se em consideração o subnet address e o broadcast address?	{"A": "256.", "B": "512.", "C": "128.", "D": "258.", "E": "1026."}	B	\N	\N	A máscara /23 possui 9 bits para hosts (32 - 23 = 9), o que resulta em 2^9 = 512 endereços totais, incluindo o endereço de rede e o de broadcast. As demais alternativas apresentam valores incorretos para o cálculo da quantidade de endereços de uma máscara /23.	f	2026-09-08 15:43:25.133547	54
11	4	(FCC - TRT - 14ª Região (RO e AC) - Técnico Judiciário - Tecnologia da Informação – 2022) Sabendo que o primeiro e o último endereço IP válido de uma sub-rede são, respectivamente, 192.168.14.33 e 192.168.14.62, a máscara de sub-rede é	{"A": "255.255.255.240.", "B": "255.255.255.192.", "C": "255.255.255.128.", "D": "255.255.255.224.", "E": "255.255.255.248."}	D	\N	\N	Sabendo que o primeiro IP válido é 33, o endereço de rede anterior é 32. Como o último IP válido é 62, o endereço de broadcast seguinte é 63. O bloco total possui 32 endereços (de 32 a 63), o que corresponde a uma máscara de sub-rede com prefixo /27, equivalente a 255.255.255.224.	f	2026-09-08 15:43:25.133547	54
12	4	(FGV - SEDUC-SP - Professor – 2023) Assinale a opção que indica quantas sub-redes podem ser criadas a partir do bloco de endereços IP 192.168.100.0/24 usando uma máscara de sub-rede /26 (ou 255.255.255.192).	{"A": "1 sub-rede.", "B": "4 sub-redes.", "C": "8 sub-redes.", "D": "16 sub-redes.", "E": "32 sub-redes."}	B	\N	\N	Partindo de uma rede base /24 e aplicando uma máscara /26, são emprestados 2 bits para a criação de sub-redes (26 - 24 = 2). Com 2 bits, é possível gerar 2^2 = 4 sub-redes. As demais alternativas trazem valores incorretos de acordo com a quantidade de bits de empréstimo.	f	2026-09-08 15:43:25.133547	54
13	4	(FGV - MPE-GO - Assistente de Sistemas – 2022) Uma equipe de manutenção de redes está configurando os dispositivos de uma rede local dividida em várias sub-redes lógicas. O computador Z está conectado à sub-rede 223.1.0.96/30 e utilizará o último endereço de host desta sub-rede. Assim sendo, a equipe deve configurar o computador Z com o seguinte endereço IP de host e máscara de sub-rede	{"A": "223.1.0.100 e 255.255.255.253.", "B": "223.1.0.99 e 255.255.255.253.", "C": "223.1.0.99 e 255.255.255.252.", "D": "223.1.0.98 e 255.255.255.253.", "E": "223.1.0.98 e 255.255.255.252."}	E	\N	\N	A sub-rede 223.1.0.96/30 possui máscara 255.255.255.252 e abrange IPs de 96 a 99. O primeiro IP (96) é a rede, o último (99) é o broadcast, e os hosts válidos são 97 e 98 (sendo 98 o último endereço de host).	f	2026-09-08 15:43:35.925543	54
14	4	(FGV - Câmara de Taubaté - SP - Técnico Legislativo - Técnico em Hardware – 2022) Os endereços IPv4, no início da Internet, eram subdivididos em classes A, B, C, D e E. A máscara padrão de uma sub-rede da classe C é	{"A": "0.0.0.0.", "B": "255.0.0.0.", "C": "255.255.0.0.", "D": "255.255.255.0", "E": "255.255.255.255."}	D	\N	\N	A classe C utiliza os três primeiros octetos para identificação de rede, resultando na máscara padrão 255.255.255.0. As demais opções representam outras máscaras como /0, /8, /16 e /32.	f	2026-09-08 15:43:35.925543	54
15	4	(CESPE / CEBRASPE - CAU-BR - Assistente de Tecnologia da Informação - 2024) Julgue o item subsecutivo, com referência a configuração de rede de computadores, serviços de helpdesk e sistema operacional Windows Server. No IPv4, a máscara de rede 255.255.255.192 deve ser utilizada para se criar uma sub-rede com suporte a 62 hosts.	{"C": "Certo", "E": "Errado"}	C	\N	\N	A máscara 255.255.255.192 corresponde a um prefixo /26, que possui 6 bits para hosts (32 - 26 = 6). Calculando 2^6 - 2, obtemos exatamente 62 hosts utilizáveis, tornando a afirmação correta.	f	2026-09-08 15:43:35.925543	54
16	4	(FGV - TCE-SP - Auxiliar de Fiscalização - 2023) Hugo, responsável pela rede de computadores da universidade XYZ, divide a rede da universidade em três sub-redes: X, Y e Z, cujos endereços são 192.168.37.0/25, 192.168.37.128/26 e 192.168.37.192/26, respectivamente. A quantidade de hosts efetivos de cada uma dessas sub-redes, respectivamente, é:	{"A": "126, 62 e 62;", "B": "128, 64 e 64;", "C": "128, 64 e 192;", "D": "254, 126 e 126;", "E": "256, 128 e 128."}	A	\N	\N	A sub-rede /25 possui 7 bits para host (2^7 - 2 = 126), e as duas sub-redes /26 possuem 6 bits para host cada (2^6 - 2 = 62), resultando em 126, 62 e 62 hosts efetivos.	f	2026-09-08 15:43:35.925543	54
\.


--
-- Data for Name: theories; Type: TABLE DATA; Schema: public; Owner: portal_user
--

COPY public.theories (id, module_id, title, content_markdown, topic_tag, created_at) FROM stdin;
\.


--
-- Data for Name: upload_tasks; Type: TABLE DATA; Schema: public; Owner: portal_user
--

COPY public.upload_tasks (id, filename, module_name, status, total_chunks, processed_chunks, error_message, created_at) FROM stdin;
ae2e17bd-f079-4caa-a7d3-24fae918393a	Internet Protocol.pdf	Sistemas Operacionais, Redes e Nuvem	completed	6	6	\N	2026-09-08 15:42:41.781143
\.


--
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: portal_user
--

COPY public.user_progress (id, question_id, chosen_option, is_correct, answered_at, user_id) FROM stdin;
1	1	C	f	2026-09-08 16:41:04.571684	1
2	1	D	t	2026-09-08 17:03:56.355492	1
3	2	E	t	2026-09-08 17:04:45.162135	1
4	3	C	t	2026-09-08 17:04:47.70289	1
5	4	E	t	2026-09-08 17:04:49.597124	1
6	5	C	t	2026-09-08 17:04:51.782217	1
7	6	B	f	2026-09-08 17:04:54.488286	1
8	1	D	t	2026-09-08 17:08:41.358662	1
9	2	E	t	2026-09-08 17:08:48.781898	1
10	7	B	f	2026-09-08 17:10:05.717624	1
11	1	D	t	2026-09-08 17:11:01.16964	1
12	1	D	t	2026-09-08 20:18:36.163721	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: portal_user
--

COPY public.users (id, username, password_hash, created_at) FROM stdin;
1	marco	$2b$12$Fp7QDBm05KHEyIbaUgfA.uzkmJoiNfvwTGuLbJKar4LclOXNLg2nS	2026-09-08 20:07:27.630588
2	ronaldo	$2b$12$wVRB2GT7fboQGQiofJRs6e6p7AGUzEuuYWZJB2ObrRHPwGQoQB0bG	2026-09-08 20:07:31.753531
\.


--
-- Name: contents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: portal_user
--

SELECT pg_catalog.setval('public.contents_id_seq', 86, true);


--
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: portal_user
--

SELECT pg_catalog.setval('public.modules_id_seq', 7, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: portal_user
--

SELECT pg_catalog.setval('public.questions_id_seq', 16, true);


--
-- Name: theories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: portal_user
--

SELECT pg_catalog.setval('public.theories_id_seq', 1, false);


--
-- Name: user_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: portal_user
--

SELECT pg_catalog.setval('public.user_progress_id_seq', 12, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: portal_user
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: contents contents_materia_topico_key; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.contents
    ADD CONSTRAINT contents_materia_topico_key UNIQUE (materia, topico);


--
-- Name: contents contents_pkey; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.contents
    ADD CONSTRAINT contents_pkey PRIMARY KEY (id);


--
-- Name: modules modules_name_key; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_name_key UNIQUE (name);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: theories theories_pkey; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.theories
    ADD CONSTRAINT theories_pkey PRIMARY KEY (id);


--
-- Name: upload_tasks upload_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.upload_tasks
    ADD CONSTRAINT upload_tasks_pkey PRIMARY KEY (id);


--
-- Name: user_progress user_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_questions_content; Type: INDEX; Schema: public; Owner: portal_user
--

CREATE INDEX idx_questions_content ON public.questions USING btree (content_id);


--
-- Name: idx_questions_module; Type: INDEX; Schema: public; Owner: portal_user
--

CREATE INDEX idx_questions_module ON public.questions USING btree (module_id);


--
-- Name: idx_user_progress_question; Type: INDEX; Schema: public; Owner: portal_user
--

CREATE INDEX idx_user_progress_question ON public.user_progress USING btree (question_id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: portal_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: portal_user
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: questions questions_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.contents(id) ON DELETE SET NULL;


--
-- Name: questions questions_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: questions questions_related_theory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_related_theory_id_fkey FOREIGN KEY (related_theory_id) REFERENCES public.theories(id) ON DELETE SET NULL;


--
-- Name: theories theories_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.theories
    ADD CONSTRAINT theories_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: user_progress user_progress_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: user_progress user_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict lf2bFhSalZqg5ibn6ZNdydA5msLkRPS6wppBUTM71zBpnfiBSo8e2DV3pDfKU1x

