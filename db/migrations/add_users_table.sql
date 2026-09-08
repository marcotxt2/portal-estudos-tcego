-- Criação da tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir o usuário padrão (marco)
-- Como a senha será setada no script Python, podemos colocar um hash fixo provisório (ex: '123' em bcrypt ou vazio por enquanto)
-- Vamos inserir o usuário admin:
INSERT INTO users (id, username, password_hash) VALUES (1, 'marco', '');

-- Adicionar user_id nas tabelas existentes e atualizar registros

-- SQLite não suporta adicionar CONSTRAINT via ALTER TABLE, 
-- Então adicionaremos apenas a coluna e atualizaremos. 
-- Idealmente faríamos a recriação da tabela.

ALTER TABLE user_progress ADD COLUMN user_id INTEGER REFERENCES users(id);
UPDATE user_progress SET user_id = 1 WHERE user_id IS NULL;

-- Mesma coisa para upload_tasks se necessário, mas o spec mencionou apenas user_progress (AC-052).
-- Para garantir integridade caso exista a tabela upload_tasks:
-- ALTER TABLE upload_tasks ADD COLUMN user_id INTEGER REFERENCES users(id);
-- UPDATE upload_tasks SET user_id = 1 WHERE user_id IS NULL;
