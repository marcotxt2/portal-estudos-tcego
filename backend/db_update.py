import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://portal_user:portal_pass@localhost:5432/portal_db")

def upgrade_db(engine_override=None):
    if engine_override:
        engine = engine_override
    else:
        print(f"Connecting to database: {DB_URL}")
        engine = create_engine(DB_URL)
        
    with engine.begin() as conn:
        print("Aplicando atualizacoes no schema do banco de dados...")
        # 1. Coluna is_ai_generated na tabela questions
        try:
            conn.execute(text("ALTER TABLE questions ADD COLUMN is_ai_generated BOOLEAN DEFAULT FALSE NOT NULL;"))
        except Exception:
            pass  # Ja existe

        # 2. Coluna source_file na tabela questions
        try:
            conn.execute(text("ALTER TABLE questions ADD COLUMN source_file VARCHAR(255);"))
        except Exception:
            pass  # Ja existe

        # 3. Coluna extracted_questions_count na tabela upload_tasks
        try:
            conn.execute(text("ALTER TABLE upload_tasks ADD COLUMN extracted_questions_count INTEGER DEFAULT 0 NOT NULL;"))
        except Exception:
            pass  # Ja existe

        print("Atualizacao do banco concluida com sucesso!")

if __name__ == "__main__":
    upgrade_db()
