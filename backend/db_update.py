import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://portal_user:portal_pass@localhost:5432/portal_db")

def upgrade_db():
    print(f"Connecting to database: {DB_URL}")
    engine = create_engine(DB_URL)
    with engine.begin() as conn:
        print("Adicionando coluna is_ai_generated na tabela questions se nao existir...")
        conn.execute(text('''
            ALTER TABLE questions 
            ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE NOT NULL;
        '''))
        print("Atualizacao do banco concluida com sucesso!")

if __name__ == "__main__":
    upgrade_db()
