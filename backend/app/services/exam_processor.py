import os
import json
import uuid
import time
import tempfile
import re

import pypdf
from google import genai
from google.genai import types
from pydantic import BaseModel
from tenacity import retry, wait_random_exponential, stop_after_attempt
from dotenv import load_dotenv

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Exam, Question, UploadTask, Content

load_dotenv()

GEMINI_SLEEP_TIME = float(os.getenv("GEMINI_SLEEP_TIME", "0"))


# ---------------------------------------------------------------------------
# Pydantic schemas internos
# ---------------------------------------------------------------------------

class ExamQuestionExtracted(BaseModel):
    question_number: int
    statement: str
    options: dict[str, str]
    correct_option: str | None = None
    explanation: str | None = None
    materia: str | None = None
    topico: str | None = None
    is_ai_generated: bool = False


class ExamExtractedContent(BaseModel):
    questions: list[ExamQuestionExtracted]


# ---------------------------------------------------------------------------
# Helpers de parsing
# ---------------------------------------------------------------------------

def _clean_json(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
    return cleaned


def _parse_gabarito(raw: str) -> dict[int, str]:
    cleaned = _clean_json(raw)
    try:
        data = json.loads(cleaned)
    except Exception:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
        else:
            raise
    return {int(k): str(v).upper() for k, v in data.items() if str(k).isdigit()}


def _parse_exam_questions(raw: str) -> ExamExtractedContent:
    cleaned = _clean_json(raw)
    try:
        data = json.loads(cleaned)
    except Exception:
        match = re.search(r"(\[.*\]|\{.*\})", cleaned, re.DOTALL)
        if match:
            data = json.loads(match.group(1))
        else:
            raise
    if isinstance(data, list):
        data = {"questions": data}
    elif isinstance(data, dict) and "questions" not in data:
        for val in data.values():
            if isinstance(val, list):
                data = {"questions": val}
                break
        else:
            data = {"questions": []}
    return ExamExtractedContent.model_validate(data)


# ---------------------------------------------------------------------------
# Chamadas ao Gemini
# ---------------------------------------------------------------------------

def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured")
    return genai.Client(api_key=api_key)


@retry(wait=wait_random_exponential(multiplier=3, max=65), stop=stop_after_attempt(5))
def extract_gabarito(gabarito_path: str, cargo: str | None = None) -> dict[int, str]:
    client = _get_client()
    prompt = (
        "Analise o PDF de gabarito em anexo"
        + (f" para o cargo ou opcao '{cargo}'" if cargo else "")
        + " e retorne EXCLUSIVAMENTE um objeto JSON "
        "com o mapa de numero da questao (inteiro) para a letra correta (string maiuscula). "
        'Formato exato: {"1": "B", "2": "D", "3": "A", ...}. '
        "Extraia TODOS os numeros de questao presentes para o cargo/opcao indicado (ou todas se houver apenas um cargo). Nao inclua nenhum campo adicional."
    )
    uploaded = None
    try:
        uploaded = client.files.upload(path=gabarito_path)
        part = types.Part.from_uri(file_uri=uploaded.uri, mime_type="application/pdf")

        models_to_try = list(dict.fromkeys([
            os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-flash-lite-latest",
        ]))

        last_error = None
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[part, prompt],
                    config={"response_mime_type": "application/json"},
                )
                res = _parse_gabarito(response.text)
                if GEMINI_SLEEP_TIME > 0:
                    time.sleep(GEMINI_SLEEP_TIME)
                return res
            except Exception as err:
                last_error = err
                err_str = str(err)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    print(f"[gabarito] Modelo {model_name} rate-limited, aguardando 2s...")
                    time.sleep(2)
                    continue
                if any(code in err_str for code in ["500", "503", "404", "UNAVAILABLE", "ServerError"]):
                    print(f"[gabarito] Modelo {model_name} indisponivel ({err_str}), aguardando 2s...")
                    time.sleep(2)
                    continue
                raise err
        if last_error:
            raise last_error
    finally:
        if uploaded:
            try:
                client.files.delete(name=uploaded.name)
            except Exception:
                pass


@retry(wait=wait_random_exponential(multiplier=3, max=65), stop=stop_after_attempt(5))
def extract_exam_chunk(chunk_path: str, contents_json: str) -> ExamExtractedContent:
    client = _get_client()

    schema_example = (
        '{\n'
        '  "questions": [\n'
        '    {\n'
        '      "question_number": 1,\n'
        '      "statement": "string",\n'
        '      "options": {"A": "string", "B": "string", "C": "string", "D": "string", "E": "string"},\n'
        '      "explanation": "Texto justificando a alternativa correta",\n'
        '      "materia": "string exata da lista ou null",\n'
        '      "topico": "string exata da lista ou null",\n'
        '      "is_ai_generated": false\n'
        '    }\n'
        '  ]\n'
        '}'
    )

    prompt = (
        "Analise as paginas do caderno de prova em anexo. "
        "Extraia APENAS questoes de multipla escolha (A, B, C, D, E). "
        "Ignore cabecalhos, instrucoes, textos de apresentacao e gabarito. "
        "Para cada questao inclua o campo 'question_number' com o numero inteiro da questao conforme aparece no caderno. "
        "Para o campo 'explanation', escreva 1 a 3 frases justificando a alternativa correta. "
        f"Classifique 'materia' e 'topico' ESTRITAMENTE usando a lista: {contents_json}. "
        "Copie as strings EXATAMENTE como estao. Se nao houver encaixe em nenhuma materia, retorne null para ambos. "
        f"Retorne EXCLUSIVAMENTE um JSON valido com esta estrutura:\n{schema_example}"
    )

    uploaded = None
    try:
        uploaded = client.files.upload(path=chunk_path)
        part = types.Part.from_uri(file_uri=uploaded.uri, mime_type="application/pdf")

        models_to_try = list(dict.fromkeys([
            os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest"),
            "gemini-flash-lite-latest",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
        ]))

        last_error = None
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[part, prompt],
                    config={"response_mime_type": "application/json"},
                )
                result = _parse_exam_questions(response.text)
                if GEMINI_SLEEP_TIME > 0:
                    time.sleep(GEMINI_SLEEP_TIME)
                return result
            except Exception as err:
                last_error = err
                err_str = str(err)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    print(f"Modelo {model_name} rate-limited, aguardando 2s...")
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
        if uploaded:
            try:
                client.files.delete(name=uploaded.name)
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------

def process_exam_background(
    caderno_path: str,
    gabarito_path: str,
    exam_id: int,
    task_id: str,
):
    db: Session = SessionLocal()
    chunks: list = []

    try:
        task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
        if task:
            task.status = "processing"
            db.commit()

        # 1. Extrair gabarito
        cargo_name = None
        exam_obj = db.query(Exam).filter(Exam.id == exam_id).first()
        if exam_obj:
            cargo_name = exam_obj.cargo

        print(f"[exam_processor] Extraindo gabarito: {gabarito_path} (cargo: {cargo_name})")
        try:
            gabarito_map = extract_gabarito(gabarito_path, cargo=cargo_name)
            print(f"[exam_processor] Gabarito extraido: {len(gabarito_map)} questoes")
        except Exception as e:
            print(f"[exam_processor] Erro ao extrair gabarito: {e}")
            gabarito_map = {}

        # 2. Lista canonicа
        contents = db.query(Content).all()
        contents_list = [{"materia": c.materia, "topico": c.topico} for c in contents]
        contents_json = json.dumps(contents_list, ensure_ascii=False)

        # 3. Dividir caderno em chunks de 8 paginas
        try:
            reader = pypdf.PdfReader(caderno_path)
            total_pages = len(reader.pages)
            if total_pages == 0:
                raise ValueError("PDF sem paginas.")
            temp_dir = tempfile.gettempdir()
            chunk_size = 8
            for i in range(0, total_pages, chunk_size):
                writer = pypdf.PdfWriter()
                for j in range(i, min(i + chunk_size, total_pages)):
                    writer.add_page(reader.pages[j])
                chunk_path = os.path.join(temp_dir, f"{uuid.uuid4()}_exam_chunk_{i}.pdf")
                with open(chunk_path, "wb") as f:
                    writer.write(f)
                chunks.append(chunk_path)
        except Exception as e:
            print(f"[exam_processor] Erro ao dividir PDF: {e}")
            if task:
                task.status = "error"
                task.error_message = f"PDF invalido: {e}"
                db.commit()
            return

        if task:
            task.total_chunks = len(chunks)
            db.commit()

        total_extracted = task.extracted_questions_count if (task and isinstance(task.extracted_questions_count, int)) else 0
        source_filename = task.filename if task and task.filename else os.path.basename(caderno_path)
        start_index = task.processed_chunks if (task and isinstance(task.processed_chunks, int)) else 0

        # 4. Processar chunks
        for chunk_path in chunks[start_index:]:
            try:
                extracted = extract_exam_chunk(chunk_path, contents_json)
                total_extracted += len(extracted.questions)

                for q in extracted.questions:
                    correct_option = gabarito_map.get(q.question_number)
                    is_ai_gen = q.is_ai_generated
                    if not correct_option and q.correct_option:
                        correct_option = q.correct_option.strip().upper()
                        is_ai_gen = True

                    needs_review_flag = (correct_option is None or correct_option == "")

                    content_id = None
                    if q.materia and q.topico:
                        content = next(
                            (c for c in contents if c.materia == q.materia and c.topico == q.topico),
                            None,
                        )
                        if content:
                            content_id = content.id
                        else:
                            needs_review_flag = True

                    # Deduplicar dentro do mesmo exam
                    norm_stmt = re.sub(r"\W+", "", q.statement.lower())
                    existing = db.query(Question).filter(Question.exam_id == exam_id).all()
                    is_duplicate = any(
                        re.sub(r"\W+", "", eq.statement.lower()) == norm_stmt for eq in existing
                    )

                    if not is_duplicate:
                        question = Question(
                            content_id=content_id,
                            statement=q.statement,
                            options=q.options,
                            correct_option=correct_option or "",
                            explanation=q.explanation,
                            is_ai_generated=is_ai_gen,
                            source_file=source_filename,
                            source_type="exam",
                            exam_id=exam_id,
                            question_number=q.question_number,
                            needs_review=needs_review_flag,
                            suggested_materia=q.materia,
                            suggested_topico=q.topico,
                        )
                        db.add(question)

                db.commit()
                if task:
                    task.processed_chunks += 1
                    task.extracted_questions_count = total_extracted
                    db.commit()
                print(f"[exam_processor] {len(extracted.questions)} questoes inseridas.")

            except Exception as e:
                import traceback
                error_detail = traceback.format_exc()
                print(f"[exam_processor] Erro no chunk: {error_detail}")
                db.rollback()
                if task:
                    task.status = "error"
                    task.error_message = error_detail[:1000]
                    db.commit()
                break

        if task and task.status != "error":
            task.status = "completed"
            task.extracted_questions_count = total_extracted
            db.commit()

    except Exception as e:
        print(f"[exam_processor] Erro geral: {e}")
        if task:
            task.status = "error"
            task.error_message = str(e)[:1000]
            db.commit()
    finally:
        for cp in chunks:
            if os.path.exists(cp):
                try:
                    os.remove(cp)
                except Exception:
                    pass
        if task and task.status == "completed":
            for p in [caderno_path, gabarito_path]:
                if p and os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass
        db.close()
