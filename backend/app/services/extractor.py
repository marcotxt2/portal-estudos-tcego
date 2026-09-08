import os
import json
import pypdf
import uuid
import tempfile
from google import genai
from google.genai import types
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
    explanation: dict[str, str] | None = None
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
def extract_content_with_gemini(file_path: str) -> ExtractedContent:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured")
    gemini_client = genai.Client(api_key=api_key)

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
        '      "explanation": {"A": "Por que a letra A esta correta", "B": "Por que a letra B esta errada"},\n'
        '      "is_ai_generated": false\n'
        '    }\n'
        '  ]\n'
        '}'
    )
    prompt = (
        "Analise visualmente as páginas do PDF em anexo. "
        "Separe todo o conteúdo em duas categorias estritas:\n"
        "1. theories: blocos de teoria com título e conteúdo em markdown. Perguntas retóricas ou de fixação devem ser agrupadas aqui como texto markdown, NÃO como 'questions'.\n"
        "2. questions: EXCLUSIVAMENTE questões REAIS de provas/concursos. Elas DEVEM ser de Múltipla Escolha (A, B, C, D, E) ou Certo/Errado (C/E).\n\n"
        "IMPORTANTE: Se você encontrar uma questão REAL de concurso que se repete logo no slide seguinte e a resposta correta estiver indicada apenas por meios visuais (ex: texto de cor diferente, sublinhado, itálico, negrito, caixa ao redor), NÃO a marque como gerada por IA. Apenas extraia a questão, preencha a 'correct_option' de acordo com o destaque visual, e mantenha 'is_ai_generated' como false.\n"
        "Use 'is_ai_generated' = true APENAS se a resposta NÃO estiver destacada de forma alguma no PDF e você precisar deduzir a resposta com seu próprio conhecimento.\n"
        "Para cada questão, preencha também o dicionário 'explanation' com uma breve justificativa didática (1 a 2 frases curtas) sobre por que a alternativa correta está certa, e por que as demais (incorretas) estão erradas.\n\n"
        f"Retorne EXCLUSIVAMENTE um objeto JSON válido com esta estrutura exata:\n{schema_example}"
    )

    uploaded_file = None
    try:
        # Upload para a File API do Gemini
        uploaded_file = gemini_client.files.upload(path=file_path)
        part = types.Part.from_uri(file_uri=uploaded_file.uri, mime_type='application/pdf')
        
        models_to_try = [
            os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest"),
            "gemini-flash-lite-latest",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
        ]
        # Remove duplicados preservando a ordem
        models_to_try = list(dict.fromkeys(models_to_try))

        last_error = None
        for model_name in models_to_try:
            try:
                response = gemini_client.models.generate_content(
                    model=model_name,
                    contents=[part, prompt],
                    config={
                        'response_mime_type': 'application/json',
                    },
                )
                return ExtractedContent.model_validate_json(response.text)
            except Exception as err:
                last_error = err
                err_str = str(err)
                if any(code in err_str for code in ["429", "503", "404", "RESOURCE_EXHAUSTED", "UNAVAILABLE"]):
                    print(f"Modelo {model_name} indisponivel ({err_str[:80]}), tentando fallback...")
                    continue
                raise err
        if last_error:
            raise last_error
    finally:
        if uploaded_file:
            try:
                gemini_client.files.delete(name=uploaded_file.name)
            except Exception as e:
                print(f"Failed to delete uploaded file: {e}")


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
        
        # Dividindo o PDF original em partes menores (15 paginas por chunk)
        chunk_size = 15
        chunks = []
        try:
            reader = pypdf.PdfReader(file_path)
            total_pages = len(reader.pages)
            if total_pages == 0:
                raise ValueError("PDF sem paginas.")

            temp_dir = tempfile.gettempdir()
            for i in range(0, total_pages, chunk_size):
                writer = pypdf.PdfWriter()
                end_page = min(i + chunk_size, total_pages)
                for j in range(i, end_page):
                    writer.add_page(reader.pages[j])
                
                chunk_path = os.path.join(temp_dir, f"{uuid.uuid4()}_chunk_{i}.pdf")
                with open(chunk_path, "wb") as f:
                    writer.write(f)
                chunks.append(chunk_path)
                
        except Exception as e:
            print(f"Erro ao ler ou dividir o PDF: {e}")
            if task:
                task.status = "error"
                task.error_message = f"PDF vazio, corrompido ou inacessível: {e}"
                db.commit()
            return

        if task:
            task.total_chunks = len(chunks)
            db.commit()

        chunk_error = False
        for chunk_path in chunks:
            try:
                extracted = extract_content_with_gemini(chunk_path)
                
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
                        explanation=q.explanation,
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
                chunk_error = True
                break  # interrompe o loop ao primeiro erro real apos esgotamento do retry
            finally:
                if os.path.exists(chunk_path):
                    try:
                        os.remove(chunk_path)
                    except:
                        pass

        # Somente marca como completed se nenhum chunk falhou
        if task and not chunk_error:
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
