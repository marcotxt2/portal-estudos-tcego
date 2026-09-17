"""
Processador de provas scrapeadas.

Conecta o scraper (fcc_scraper) ao pipeline de extracao Gemini (exam_processor),
garantindo que apenas questoes do conteudo do edital sejam inseridas.
"""

import os
import re
import uuid
import time
import logging
import traceback
import tempfile

import pypdf
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Exam, Question, Content, UploadTask, GenerationLog, ScrapedExam
from app.services.exam_processor import extract_exam_chunk
from app.services.edital_config import get_contents_json, EDITAL_CONTENTS
from app.services.fcc_scraper import discover_exam_urls, download_exam_pdf, ScrapedExamMeta

logger = logging.getLogger("scrape_processor")


def _is_already_processed(source_url: str, db: Session) -> bool:
    """Verifica se a URL ja foi processada."""
    return db.query(ScrapedExam).filter(ScrapedExam.source_url == source_url).first() is not None


def _split_pdf_into_chunks(pdf_path: str, chunk_size: int = 8) -> list[str]:
    """Divide um PDF em chunks menores, retorna lista de paths."""
    reader = pypdf.PdfReader(pdf_path)
    total_pages = len(reader.pages)
    if total_pages == 0:
        raise ValueError("PDF sem paginas.")

    chunks = []
    temp_dir = tempfile.gettempdir()
    for i in range(0, total_pages, chunk_size):
        writer = pypdf.PdfWriter()
        for j in range(i, min(i + chunk_size, total_pages)):
            writer.add_page(reader.pages[j])
        chunk_path = os.path.join(temp_dir, f"{uuid.uuid4()}_scrape_chunk_{i}.pdf")
        with open(chunk_path, "wb") as f:
            writer.write(f)
        chunks.append(chunk_path)

    return chunks


def _get_valid_materias() -> set[str]:
    """Retorna set de materias validas do edital."""
    return set(EDITAL_CONTENTS.keys())


def process_scraped_exam(meta: ScrapedExamMeta, pdf_path: str, db: Session) -> int:
    """
    Processa uma prova scrapeada:
    1. Cria registro Exam
    2. Divide PDF em chunks
    3. Extrai questoes via Gemini (usando conteudo do edital como referencia)
    4. Filtra apenas questoes que se encaixam no edital
    5. Insere no banco com source_type='scraped', needs_review=true

    Retorna quantidade de questoes inseridas.
    """
    # Criar registro da prova
    exam = Exam(
        banca="FCC",
        cargo=meta.cargo,
        ano=meta.ano or 0,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    # Conteudo do edital para o Gemini classificar
    contents_json = get_contents_json()
    valid_materias = _get_valid_materias()

    # Carregar contents do banco para lookup de content_id
    contents_db = db.query(Content).all()

    # Dividir PDF
    chunks = _split_pdf_into_chunks(pdf_path)
    total_inserted = 0

    try:
        for chunk_path in chunks:
            try:
                extracted = extract_exam_chunk(chunk_path, contents_json)

                for q in extracted.questions:
                    # FILTRO EDITAL: descartar questoes sem materia classificada
                    # ou com materia fora do edital
                    if not q.materia or q.materia not in valid_materias:
                        logger.debug(
                            f"[scrape_processor] Questao {q.question_number} fora do edital "
                            f"(materia='{q.materia}'), descartada."
                        )
                        continue

                    # Sem gabarito oficial: Gemini infere a resposta
                    correct_option = ""
                    is_ai_gen = True
                    if q.correct_option:
                        correct_option = q.correct_option.strip().upper()

                    # Lookup content_id
                    content_id = None
                    needs_review = True
                    if q.materia and q.topico:
                        content = next(
                            (c for c in contents_db if c.materia == q.materia and c.topico == q.topico),
                            None,
                        )
                        if content:
                            content_id = content.id
                            needs_review = False

                    # Deduplicacao: normalizar statement e comparar
                    norm_stmt = re.sub(r"\W+", "", q.statement.lower())
                    existing = db.query(Question).filter(Question.exam_id == exam.id).all()
                    is_duplicate = any(
                        re.sub(r"\W+", "", eq.statement.lower()) == norm_stmt for eq in existing
                    )
                    if is_duplicate:
                        continue

                    question = Question(
                        content_id=content_id,
                        statement=q.statement,
                        options=q.options,
                        correct_option=correct_option,
                        explanation=q.explanation,
                        is_ai_generated=is_ai_gen,
                        source_type="scraped",
                        source_file=meta.url.split("/")[-1][:255],
                        exam_id=exam.id,
                        question_number=q.question_number,
                        needs_review=needs_review,
                        suggested_materia=q.materia,
                        suggested_topico=q.topico,
                    )
                    db.add(question)
                    total_inserted += 1

                db.commit()
                logger.info(f"[scrape_processor] Chunk processado: {len(extracted.questions)} extraidas, {total_inserted} total inseridas.")

            except Exception as e:
                logger.error(f"[scrape_processor] Erro no chunk: {e}")
                db.rollback()
                continue

            finally:
                if os.path.exists(chunk_path):
                    try:
                        os.remove(chunk_path)
                    except Exception:
                        pass

    except Exception as e:
        logger.error(f"[scrape_processor] Erro geral: {e}")
        db.rollback()

    return total_inserted


def run_daily_scrape(max_exams: int = 2, max_pages: int = 10) -> dict:
    """
    Pipeline completo de scraping diario:
    1. Descobre URLs de provas TI no PCI Concursos
    2. Filtra as ja processadas
    3. Baixa e processa ate max_exams provas novas
    4. Registra resultado

    Retorna dict com resultado da operacao.
    """
    start_time = time.time()
    db: Session = SessionLocal()

    total_questions = 0
    exams_processed = []
    errors = []

    try:
        # 1. Descobrir provas disponiveis
        all_exams = discover_exam_urls(max_pages=max_pages)
        logger.info(f"[scrape_processor] {len(all_exams)} provas TI disponiveis.")

        # 2. Filtrar ja processadas
        new_exams = []
        for exam_meta in all_exams:
            if not _is_already_processed(exam_meta.url, db):
                new_exams.append(exam_meta)

        logger.info(f"[scrape_processor] {len(new_exams)} provas novas (nao processadas).")

        if not new_exams:
            duration = time.time() - start_time
            log = GenerationLog(
                questions_generated=0,
                topics_covered=[],
                status="success",
                error_message="Nenhuma prova nova encontrada.",
                duration_seconds=round(duration, 2),
            )
            db.add(log)
            db.commit()
            return {
                "status": "success",
                "message": "Nenhuma prova nova encontrada.",
                "questions_generated": 0,
                "duration_seconds": round(duration, 2),
            }

        # 3. Processar ate max_exams
        for exam_meta in new_exams[:max_exams]:
            scraped_record = ScrapedExam(
                source_url=exam_meta.url,
                cargo=exam_meta.cargo,
                ano=exam_meta.ano,
                orgao=exam_meta.orgao,
                status="processing",
            )
            db.add(scraped_record)
            db.commit()

            try:
                # Download
                pdf_path = download_exam_pdf(exam_meta.url)
                if not pdf_path:
                    scraped_record.status = "error"
                    scraped_record.error_message = "Falha no download do PDF"
                    db.commit()
                    errors.append(f"{exam_meta.cargo}: download falhou")
                    continue

                # Processar
                count = process_scraped_exam(exam_meta, pdf_path, db)
                total_questions += count

                scraped_record.status = "success"
                scraped_record.questions_extracted = count
                db.commit()

                exams_processed.append({
                    "cargo": exam_meta.cargo,
                    "ano": exam_meta.ano,
                    "orgao": exam_meta.orgao,
                    "questions": count,
                })
                logger.info(f"[scrape_processor] Prova processada: {exam_meta.cargo} ({exam_meta.ano}) -> {count} questoes")

                # Cleanup PDF
                if pdf_path and os.path.exists(pdf_path):
                    try:
                        os.remove(pdf_path)
                    except Exception:
                        pass

            except Exception as e:
                error_detail = traceback.format_exc()
                logger.error(f"[scrape_processor] Erro processando {exam_meta.url}: {error_detail}")
                scraped_record.status = "error"
                scraped_record.error_message = str(e)[:500]
                db.commit()
                errors.append(f"{exam_meta.cargo}: {str(e)[:200]}")

        # 4. Registrar log
        duration = time.time() - start_time
        status = "success" if not errors else ("partial" if total_questions > 0 else "error")

        log = GenerationLog(
            questions_generated=total_questions,
            topics_covered=exams_processed,
            status=status,
            error_message="\n".join(errors)[:1000] if errors else None,
            duration_seconds=round(duration, 2),
        )
        db.add(log)
        db.commit()

        result = {
            "status": status,
            "questions_generated": total_questions,
            "exams_processed": len(exams_processed),
            "exams": exams_processed,
            "errors": errors,
            "duration_seconds": round(duration, 2),
        }
        logger.info(f"[scrape_processor] Concluido: {result}")
        return result

    except Exception as e:
        duration = time.time() - start_time
        error_detail = traceback.format_exc()
        logger.error(f"[scrape_processor] Erro geral: {error_detail}")

        try:
            log = GenerationLog(
                questions_generated=total_questions,
                topics_covered=exams_processed,
                status="error",
                error_message=str(e)[:1000],
                duration_seconds=round(duration, 2),
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()

        return {
            "status": "error",
            "questions_generated": total_questions,
            "error": str(e),
            "duration_seconds": round(duration, 2),
        }
    finally:
        db.close()
