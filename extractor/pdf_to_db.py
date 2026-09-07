import os
import glob
import json
import psycopg
import pdfplumber
from google import genai
from pydantic import BaseModel
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from dotenv import load_dotenv

load_dotenv()

# Configurações
DB_URL = os.getenv("DATABASE_URL", "postgresql://portal_user:portal_pass@localhost:5432/portal_db")
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

# Schemas de Retorno para o Gemini
class QuestionExtracted(BaseModel):
    statement: str
    options: dict[str, str]
    correct_option: str
    related_theory_text: str | None = None
    is_ai_generated: bool = False

class TheoryExtracted(BaseModel):
    title: str
    content_markdown: str
    topic_tag: str | None = None

class ExtractedContent(BaseModel):
    theories: list[TheoryExtracted]
    questions: list[QuestionExtracted]

# Função com retry (Exponential Backoff) para lidar com Rate Limit
@retry(
    wait=wait_exponential(multiplier=2, min=4, max=60),
    stop=stop_after_attempt(5),
    retry=retry_if_exception_type(Exception) # Captura falhas genéricas do SDK
)
def extract_content_with_gemini(text_chunk: str) -> ExtractedContent:
    prompt = (
        "Analise o seguinte trecho de texto extraído de um PDF de estudos. "
        "Separe todo o conteúdo em duas categorias estritas:\n"
        "1. theories: blocos de teoria com título e conteúdo em markdown.\n"
        "2. questions: questões contendo o enunciado, as alternativas (podem ser de Múltipla Escolha A, B, C, D, E ou Certo/Errado C/E), a alternativa correta (A, B, C, D, E, C ou E) e um texto teórico que justifique a resposta correta se houver.\n\n"
        "IMPORTANTE: Se você encontrar uma questão sem o gabarito explícito logo em seguida, VOCÊ MESMO DEVE DETERMINAR a resposta correta usando seus conhecimentos, justificar no 'related_theory_text' e setar o campo 'is_ai_generated' como true.\n\n"
        f"Texto:\n{text_chunk}"
    )
    
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': ExtractedContent,
        },
    )
    
    # O response.text já é um JSON validado pelo schema graças à API estruturada
    return ExtractedContent.model_validate_json(response.text)

def setup_db(conn):
    """Garante que as tabelas existem."""
    with conn.cursor() as cur:
        cur.execute('''
            CREATE TABLE IF NOT EXISTS modules (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                day_of_week INTEGER NOT NULL DEFAULT 0,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cur.execute('''
            CREATE TABLE IF NOT EXISTS theories (
                id SERIAL PRIMARY KEY,
                module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content_markdown TEXT NOT NULL,
                topic_tag VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cur.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
                statement TEXT NOT NULL,
                options JSONB NOT NULL,
                correct_option VARCHAR(1) NOT NULL,
                related_theory_id INTEGER REFERENCES theories(id) ON DELETE SET NULL,
                related_theory_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

def process_directory():
    base_dir = os.path.join(os.path.dirname(__file__), "input_pdfs")
    
    if not os.path.exists(base_dir):
        print(f"Diretório {base_dir} não encontrado.")
        return

    with psycopg.connect(DB_URL) as conn:
        setup_db(conn)
        
        # Iterar pelas pastas (módulos)
        for entry in os.scandir(base_dir):
            if entry.is_dir():
                module_name = entry.name
                
                # Inserir ou recuperar Módulo
                with conn.cursor() as cur:
                    cur.execute("SELECT id FROM modules WHERE name = %s", (module_name,))
                    row = cur.fetchone()
                    if row:
                        module_id = row[0]
                    else:
                        cur.execute(
                            "INSERT INTO modules (name, day_of_week) VALUES (%s, %s) RETURNING id",
                            (module_name, 0)
                        )
                        module_id = cur.fetchone()[0]
                        conn.commit()
                
                # Processar PDFs
                pdf_files = glob.glob(os.path.join(entry.path, "*.pdf"))
                for pdf_path in pdf_files:
                    print(f"Processando: {pdf_path}")
                    full_text = ""
                    with pdfplumber.open(pdf_path) as pdf:
                        for page in pdf.pages:
                            text = page.extract_text()
                            if text:
                                full_text += text + "\n"
                    
                    if not full_text.strip():
                        continue
                        
                    # Simulação de chunks de ~15k caracteres
                    chunk_size = 15000
                    chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
                    
                    for chunk in chunks:
                        try:
                            extracted = extract_content_with_gemini(chunk)
                            with conn.cursor() as cur:
                                for theory in extracted.theories:
                                    cur.execute('''
                                        INSERT INTO theories (module_id, title, content_markdown, topic_tag)
                                        VALUES (%s, %s, %s, %s)
                                    ''', (module_id, theory.title, theory.content_markdown, theory.topic_tag))
                                    
                                for q in extracted.questions:
                                    cur.execute('''
                                        INSERT INTO questions (module_id, statement, options, correct_option, related_theory_text, is_ai_generated)
                                        VALUES (%s, %s, %s, %s, %s, %s)
                                    ''', (module_id, q.statement, json.dumps(q.options), q.correct_option, q.related_theory_text, q.is_ai_generated))
                            conn.commit()
                            print(f"Inseridos {len(extracted.theories)} teorias e {len(extracted.questions)} questoes do chunk.")
                        except Exception as e:
                            print(f"Erro processando chunk de {pdf_path}: {e}")

if __name__ == "__main__":
    process_directory()
