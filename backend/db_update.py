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
        
    print("Aplicando atualizacoes no schema do banco de dados...")
    with engine.connect() as conn:
        dialect_name = engine.dialect.name
        
        if dialect_name == "postgresql":
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE NOT NULL;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_file VARCHAR(255);"))
            conn.execute(text("ALTER TABLE upload_tasks ADD COLUMN IF NOT EXISTS extracted_questions_count INTEGER DEFAULT 0 NOT NULL;"))
            # FCC exam fields
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS exams (
                    id SERIAL PRIMARY KEY,
                    banca VARCHAR(50) NOT NULL DEFAULT 'FCC',
                    cargo VARCHAR(255) NOT NULL,
                    ano INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) NOT NULL DEFAULT 'slide';"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_number INTEGER;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS suggested_materia VARCHAR(255);"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS suggested_topico VARCHAR(255);"))
            conn.commit()
        else:
            from sqlalchemy import inspect
            inspector = inspect(engine)
            table_names = inspector.get_table_names()
            
            if "questions" in table_names:
                q_cols = [c["name"] for c in inspector.get_columns("questions")]
                if "is_ai_generated" not in q_cols:
                    conn.execute(text("ALTER TABLE questions ADD COLUMN is_ai_generated BOOLEAN DEFAULT 0 NOT NULL;"))
                    conn.commit()
                if "source_file" not in q_cols:
                    conn.execute(text("ALTER TABLE questions ADD COLUMN source_file VARCHAR(255);"))
                    conn.commit()
                    
            if "upload_tasks" in table_names:
                task_cols = [c["name"] for c in inspector.get_columns("upload_tasks")]
                if "extracted_questions_count" not in task_cols:
                    conn.execute(text("ALTER TABLE upload_tasks ADD COLUMN extracted_questions_count INTEGER DEFAULT 0 NOT NULL;"))
                    conn.commit()

        print("Atualizacao do banco concluida com sucesso!")

if __name__ == "__main__":
    upgrade_db()

