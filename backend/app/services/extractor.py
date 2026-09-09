import os
import json
import pypdf
import uuid
import tempfile
import re
import threading
import time
from google import genai
from google.genai import types
from pydantic import BaseModel
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_not_exception_type
from dotenv import load_dotenv

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Module, Question, UploadTask, Content

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    client = genai.Client(api_key=API_KEY)
else:
    client = None

# Semaforo global para limitar chamadas concorrentes ao Gemini
# Agora e configuravel via ENV (padrao 5) para aproveitar melhor chaves com maior RPM.
GEMINI_CONCURRENCY = int(os.getenv("GEMINI_CONCURRENCY", "5"))
gemini_semaphore = threading.Semaphore(GEMINI_CONCURRENCY)
GEMINI_SLEEP_TIME = float(os.getenv("GEMINI_SLEEP_TIME", "0"))

# Schemas de Retorno para o Gemini
class QuestionExtracted(BaseModel):
    statement: str
    options: dict[str, str]
    correct_option: str
    explanation: str | None = None
    materia: str | None = None
    topico: str | None = None
    is_ai_generated: bool = False

class ExtractedContent(BaseModel):
    questions: list[QuestionExtracted]

def parse_extracted_json(raw_text: str) -> ExtractedContent:
    """Extrai e valida ExtractedContent lidando com retornos em formato de lista ou objeto."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
    try:
        data = json.loads(cleaned)
    except Exception:
        match = re.search(r'(\[.*\]|\{.*\})', cleaned, re.DOTALL)
        if match:
            data = json.loads(match.group(1))
        else:
            raise

    if isinstance(data, list):
        data = {"questions": data}
    elif isinstance(data, dict):
        if "questions" not in data:
            for val in data.values():
                if isinstance(val, list):
                    data = {"questions": val}
                    break
            else:
                data = {"questions": []}
    return ExtractedContent.model_validate(data)

class QuotaExceededError(Exception):
    pass

@retry(
    wait=wait_exponential(multiplier=2, min=5, max=30),
    stop=stop_after_attempt(4),
    retry=retry_if_not_exception_type(QuotaExceededError)
)
def extract_content_with_gemini(file_path: str, contents_json: str) -> ExtractedContent:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured")
    gemini_client = genai.Client(api_key=api_key)

    schema_example = (
        '{\n'
        '  "questions": [\n'
        '    {\n'
        '      "statement": "string",\n'
        '      "options": {"A": "string", "B": "string"},\n'
        '      "correct_option": "A",\n'
        '      "explanation": "Texto corrido justificando a alternativa correta e por que as demais estão erradas",\n'
        '      "materia": "string (exata da lista permitida, null se nenhuma servir)",\n'
        '      "topico": "string (exata da lista permitida, null se nenhuma servir)",\n'
        '      "is_ai_generated": false\n'
        '    }\n'
        '  ]\n'
        '}'
    )
    prompt = (
        "Analise visualmente as páginas do PDF em anexo. "
        "Extraia EXCLUSIVAMENTE questões de provas/concursos de Múltipla Escolha (A, B, C, D, E) ou Certo/Errado (C/E).\n\n"
        "IGNORE completamente blocos de texto que sejam apenas teoria, introdução ou sumário.\n"
        "IMPORTANTE SOBRE DUPLICIDADE: Se uma mesma questão aparecer repetida em páginas/slides consecutivos (ex: primeiro sem gabarito e logo em seguida com o gabarito destacado visualmente), VOCÊ DEVE EXTRAÍ-LA APENAS UMA ÚNICA VEZ. Mescle as informações: utilize o destaque visual da aparição com gabarito para preencher 'correct_option' e defina 'is_ai_generated' = false. NUNCA gere duas questões idênticas.\n"
        "Use 'is_ai_generated' = true APENAS se a resposta NÃO estiver destacada de forma alguma em NENHUMA aparição no PDF e você precisar deduzir a resposta com seu próprio conhecimento.\n"
        "Para questões de Certo/Errado (estilo CESPE/CEBRASPE), utilize ESTRITAMENTE as chaves 'C' e 'E' no objeto 'options', nunca 'A' e 'B'.\n"
        "Para cada questão, preencha também o campo 'explanation' com um único texto corrido (1 a 3 frases) justificando por que a alternativa correta está certa, e por que as demais estão erradas.\n"
        f"Classifique CADA questão informando a 'materia' e 'topico' usando ESTRITAMENTE a lista de permitidos a seguir: {contents_json}. "
        "Copie as strings EXATAMENTE como estão. Se a questão não se encaixar de forma alguma em nenhum, retorne null.\n\n"
        f"Retorne EXCLUSIVAMENTE um objeto JSON válido com esta estrutura exata:\n{schema_example}"
    )

    with gemini_semaphore:
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
                    result = parse_extracted_json(response.text)
                    if GEMINI_SLEEP_TIME > 0:
                        time.sleep(GEMINI_SLEEP_TIME)  # Intervalo de seguranca para respeitar o limite de RPM
                    return result
                except Exception as err:
                    last_error = err
                    err_str = str(err)
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        if "Quota exceeded" in err_str or "free_tier_requests" in err_str or "limit: 500" in err_str:
                            raise QuotaExceededError(f"Cota diária esgotada: {err_str}")
                        print(f"Modelo {model_name} rate-limited (RPM), aguardando 2s...")
                        time.sleep(2)
                        continue
                    if any(code in err_str for code in ["503", "404", "UNAVAILABLE"]):
                        print(f"Modelo {model_name} indisponivel, aguardando 2s...")
                        time.sleep(2)
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
            
        # Buscar lista canônica de conteúdos (materia/topico)
        contents = db.query(Content).all()
        contents_list = [{"materia": c.materia, "topico": c.topico} for c in contents]
        contents_json = json.dumps(contents_list, ensure_ascii=False)
        
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
        total_extracted_count = task.extracted_questions_count if task and task.extracted_questions_count else 0
        source_filename = task.filename if task and task.filename else os.path.basename(file_path)

        for chunk_path in chunks:
            try:
                extracted = extract_content_with_gemini(chunk_path, contents_json)
                total_extracted_count += len(extracted.questions)

                for q in extracted.questions:
                    # Deduplicar: buscar se já existe questão muito parecida no mesmo módulo
                    norm_stmt = re.sub(r'\W+', '', q.statement.lower())
                    existing_qs = db.query(Question).filter(Question.module_id == module.id).all()
                    
                    is_duplicate = False
                    for eq in existing_qs:
                        if re.sub(r'\W+', '', eq.statement.lower()) == norm_stmt:
                            is_duplicate = True
                            if not eq.source_file:
                                eq.source_file = source_filename
                            # Se a que está no banco foi deduzida pela IA e a nova tem gabarito real, atualiza
                            if eq.is_ai_generated and not q.is_ai_generated:
                                eq.options = q.options
                                eq.correct_option = q.correct_option
                                eq.explanation = q.explanation
                                eq.is_ai_generated = False
                                eq.source_file = source_filename
                            break
                            
                    content_id = None
                    if q.materia and q.topico:
                        content = next((c for c in contents if c.materia == q.materia and c.topico == q.topico), None)
                        if content:
                            content_id = content.id
                    
                    if not is_duplicate:
                        question = Question(
                            module_id=module.id,
                            content_id=content_id,
                            statement=q.statement,
                            options=q.options,
                            correct_option=q.correct_option,
                            explanation=q.explanation,
                            is_ai_generated=q.is_ai_generated,
                            source_file=source_filename
                        )
                        db.add(question)

                db.commit()
                if task:
                    task.processed_chunks += 1
                    task.extracted_questions_count = total_extracted_count
                    db.commit()
                print(f"Inseridos {len(extracted.questions)} questoes.")
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
            task.extracted_questions_count = total_extracted_count
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
