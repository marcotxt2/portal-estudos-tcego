import os
from typing import List

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import GenerationLog, Question, Content, ScrapedExam, User
from app.schemas import GenerationLogResponse, GenerationStatsResponse, ScrapedExamResponse
from app.auth import get_current_user

router = APIRouter(prefix="/generation", tags=["Generation"])


# ---------------------------------------------------------------------------
# Disparo manual
# ---------------------------------------------------------------------------

@router.post("/trigger")
def trigger_scraping(
    background_tasks: BackgroundTasks,
    max_exams: int = None,
    force: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dispara scraping de provas FCC em background."""
    from app.services.scrape_processor import run_daily_scrape

    count = max_exams or int(os.getenv("DAILY_SCRAPE_MAX_EXAMS", "2"))
    background_tasks.add_task(run_daily_scrape, max_exams=count, force_reprocess=force)

    return {
        "message": f"Scraping iniciado em background (max {count} provas, force={force}).",
        "max_exams": count,
        "force": force,
    }


# ---------------------------------------------------------------------------
# Historico de geracoes
# ---------------------------------------------------------------------------

@router.get("/logs", response_model=List[GenerationLogResponse])
def get_generation_logs(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(GenerationLog)
        .order_by(GenerationLog.run_date.desc())
        .limit(limit)
        .all()
    )


# ---------------------------------------------------------------------------
# Provas scrapeadas
# ---------------------------------------------------------------------------

@router.get("/scraped", response_model=List[ScrapedExamResponse])
def get_scraped_exams(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ScrapedExam)
        .order_by(ScrapedExam.scraped_at.desc())
        .limit(limit)
        .all()
    )


# ---------------------------------------------------------------------------
# Estatisticas
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=GenerationStatsResponse)
def get_generation_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_scraped = db.query(Question).filter(Question.source_type == "scraped").count()
    total_exam = db.query(Question).filter(Question.source_type == "exam").count()
    total_slide = db.query(Question).filter(Question.source_type == "slide").count()
    total_scraped_exams = db.query(ScrapedExam).filter(ScrapedExam.status == "success").count()

    last_log = (
        db.query(GenerationLog)
        .order_by(GenerationLog.run_date.desc())
        .first()
    )

    # Questoes scrapeadas por materia
    by_materia_raw = (
        db.query(Content.materia, func.count(Question.id))
        .join(Question, Question.content_id == Content.id)
        .filter(Question.source_type == "scraped")
        .group_by(Content.materia)
        .all()
    )
    by_materia = {m: c for m, c in by_materia_raw}

    # Scheduler status
    from app.services.daily_scheduler import get_scheduler
    scheduler = get_scheduler()
    next_run = None
    if scheduler and scheduler.running:
        job = scheduler.get_job("daily_scrape_job")
        if job and job.next_run_time:
            next_run = job.next_run_time.isoformat()

    return GenerationStatsResponse(
        total_scraped_questions=total_scraped,
        total_exam_questions=total_exam,
        total_slide_questions=total_slide,
        total_scraped_exams=total_scraped_exams,
        questions_by_materia=by_materia,
        last_run_date=last_log.run_date if last_log else None,
        last_run_status=last_log.status if last_log else None,
        last_run_count=last_log.questions_generated if last_log else 0,
        scheduler_active=scheduler is not None and scheduler.running,
        next_scheduled_run=next_run,
    )


# ---------------------------------------------------------------------------
# Cancelar / Resetar varredura em andamento
# ---------------------------------------------------------------------------

@router.post("/cancel")
def cancel_stuck_scraping(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancela/reseta varreduras travadas no status 'processing'."""
    stuck_exams = db.query(ScrapedExam).filter(ScrapedExam.status == "processing").all()
    count = len(stuck_exams)

    for ex in stuck_exams:
        ex.status = "error"
        ex.error_message = "Varredura cancelada manualmente pelo usuario."

    db.commit()

    return {
        "message": f"{count} varredura(s) travada(s) foram canceladas e resetadas com sucesso.",
        "count": count,
    }


# ---------------------------------------------------------------------------
# Limpar erros de scraping
# ---------------------------------------------------------------------------

@router.post("/clear-errors")
def clear_scraping_errors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove registros de provas e logs com erro para limpar o historico."""
    deleted_exams = db.query(ScrapedExam).filter(ScrapedExam.status.in_(["error", "cancelled"])).delete(synchronize_session=False)
    deleted_logs = db.query(GenerationLog).filter(GenerationLog.status == "error").delete(synchronize_session=False)
    db.commit()

    return {
        "message": "Historico de erros limpo com sucesso.",
        "deleted_exams": deleted_exams,
        "deleted_logs": deleted_logs,
    }
