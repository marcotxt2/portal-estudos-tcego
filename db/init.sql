-- Tabelas principais do Portal de Estudos Pessoal

CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    day_of_week INT NOT NULL, -- 0=Segunda, 1=Terca, etc.
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS theories (
    id SERIAL PRIMARY KEY,
    module_id INT REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_markdown TEXT NOT NULL,
    topic_tag VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    module_id INT REFERENCES modules(id) ON DELETE CASCADE,
    statement TEXT NOT NULL,
    options JSONB NOT NULL, -- Ex: {"A": "...", "B": "..."}
    correct_option CHAR(1) NOT NULL,
    related_theory_id INT REFERENCES theories(id) ON DELETE SET NULL,
    related_theory_text TEXT,
    explanation TEXT,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    chosen_option CHAR(1) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS upload_tasks (
    id VARCHAR(36) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_chunks INT NOT NULL DEFAULT 0,
    processed_chunks INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices para otimizar repeticao espacada e buscas
CREATE INDEX IF NOT EXISTS idx_user_progress_question ON user_progress(question_id);
CREATE INDEX IF NOT EXISTS idx_questions_module ON questions(module_id);

-- Matérias padrão fixas
INSERT INTO modules (name, day_of_week) VALUES
    ('Governança de TI e Contratações TIC', 0),
    ('Engenharia de Software e Desenvolvimento', 1),
    ('Segurança da Informação', 2),
    ('Sistemas Operacionais, Redes e Nuvem', 3),
    ('IA, Ciência de Dados e Automação', 4),
    ('Banco de Dados (Relacional, NoSQL, Vetorial)', 5),
    ('Língua Inglesa (Leitura Técnica)', 6)
ON CONFLICT (name) DO NOTHING;
