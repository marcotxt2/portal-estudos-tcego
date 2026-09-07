import os
import json
import pdfplumber
from google import genai
from pydantic import BaseModel
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from dotenv import load_dotenv

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Module, Theory, Question, UploadTask

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    client = genai.Client(api_key=API_KEY)
else:
    client = None

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

@retry(
    wait=wait_exponential(multiplier=2, min=4, max=60),
    stop=stop_after_attempt(5),
    retry=retry_if_exception_type(Exception)
)
def extract_content_with_gemini(text_chunk: str) -> ExtractedContent:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured")
    gemini_client = genai.Client(api_key=api_key)

    # Schema de exemplo embutido no prompt.
    # O SDK google-genai 0.3.0 nao suporta response_schema com modelos Pydantic aninhados
    # (gera $ref/$defs que o SDK rejeita). Usamos response_mime_type=application/json
    # e instruimos a IA com um exemplo de schema no proprio prompt.
    schema_example = (
        '{\n'
        '  "theories": [\n'
        '    {"title": "string", "content_markdown": "string", "topic_tag": "string ou null"}\n'
        '  ],\n'
        '  "questions": [\n'
        '    {\n'
        '      "statement": "string",\n'
        '      "options": {"A": "string", "B": "string"},\n'
        '      "correct_option": "A",\n'
        '      "related_theory_text": "string ou null",\n'
        '      "is_ai_generated": false\n'
        '    }\n'
        '  ]\n'
        '}'
    )
    prompt = (
        "Analise o seguinte trecho de texto extraído de um PDF de estudos. "
        "Separe todo o conteúdo em duas categorias estritas:\n"
        "1. theories: blocos de teoria com título e conteúdo em markdown.\n"
        "2. questions: questões contendo o enunciado, as alternativas (podem ser de Múltipla Escolha A, B, C, D, E ou Certo/Errado C/E), a alternativa correta (A, B, C, D, E, C ou E) e um texto teórico que justifique a resposta correta se houver.\n\n"
        "IMPORTANTE: Se você encontrar uma questão sem o gabarito explícito logo em seguida, VOCÊ MESMO DEVE DETERMINAR a resposta correta usando seus conhecimentos, justificar no 'related_theory_text' e setar o campo 'is_ai_generated' como true.\n\n"
        f"Retorne EXCLUSIVAMENTE um objeto JSON válido com esta estrutura exata:\n{schema_example}\n\n"
        f"Texto:\n{text_chunk}"
    )

    # @spec:AC-005 @spec:AC-007
    response = gemini_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
        },
    )

    return ExtractedContent.model_validate_json(response.text)


def process_pdf_background(file_path: str, module_name: str, task_id: str):
    db = SessionLocal()
    try:
        # Atualiza task para processing
        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if task:
            task.status = "processing"
            db.commit()

        # Garantir/Criar o módulo
        module = db.query(Module).filter(Module.name == module_name).first()
        if not module:
            module = Module(name=module_name, day_of_week=0)
            db.add(module)
            db.commit()
            db.refresh(module)
        
        full_text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

        if not full_text.strip():
            print("PDF vazio ou ilegível.")
            if task:
                task.status = "error"
                task.error_message = "PDF vazio ou ilegível."
                db.commit()
            return

        chunk_size = 15000
        chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
        
        if task:
            task.total_chunks = len(chunks)
            db.commit()

        for chunk in chunks:
            try:
                extracted = extract_content_with_gemini(chunk)
                
                for t in extracted.theories:
                    theory = Theory(
                        module_id=module.id,
                        title=t.title,
                        content_markdown=t.content_markdown,
                        topic_tag=t.topic_tag
                    )
                    db.add(theory)

                for q in extracted.questions:
                    question = Question(
                        module_id=module.id,
                        statement=q.statement,
                        options=q.options,
                        correct_option=q.correct_option,
                        related_theory_text=q.related_theory_text,
                        is_ai_generated=q.is_ai_generated
                    )
                    db.add(question)

                db.commit()
                if task:
                    task.processed_chunks += 1
                    db.commit()
                print(f"Inseridos {len(extracted.theories)} teorias e {len(extracted.questions)} questoes.")
            except Exception as e:
                import traceback
                from tenacity import RetryError
                if isinstance(e, RetryError):
                    error_detail = str(e.last_attempt.exception())
                    print(f"Erro processando chunk (RetryError real): {error_detail}")
                    traceback.print_exception(type(e.last_attempt.exception()), e.last_attempt.exception(), e.last_attempt.exception().__traceback__)
                else:
                    error_detail = str(e)
                    print(f"Erro processando chunk: {e}")
                    traceback.print_exc()
                db.rollback()
                # @spec:AC-006 @spec:AC-008
                # Propaga o erro para a task para que o frontend exiba a mensagem correta.
                if task:
                    task.status = "error"
                    task.error_message = f"Falha ao processar chunk: {error_detail}"
                    db.commit()
                break  # interrompe o loop ao primeiro erro real apos esgotamento do retry

        if task:
            task.status = "completed"
            db.commit()

    except Exception as e:
        print(f"Erro no processamento do PDF: {e}")
        if task:
            task.status = "error"
            task.error_message = str(e)
            db.commit()
    finally:
        # Remove arquivo temporário se necessário, a lógica da rota pode cuidar disso
        if os.path.exists(file_path):
            os.remove(file_path)
        db.close()
