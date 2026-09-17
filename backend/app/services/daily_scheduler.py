import os
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger("daily_scheduler")

_scheduler: BackgroundScheduler | None = None


def _run_daily_scrape():
    """Wrapper executado pelo scheduler."""
    from app.services.scrape_processor import run_daily_scrape

    max_exams = int(os.getenv("DAILY_SCRAPE_MAX_EXAMS", "2"))
    logger.info(f"[daily_scheduler] Iniciando scraping diario (max {max_exams} provas)...")

    try:
        result = run_daily_scrape(max_exams=max_exams)
        logger.info(f"[daily_scheduler] Resultado: {result}")
    except Exception as e:
        logger.error(f"[daily_scheduler] Erro no scraping diario: {e}", exc_info=True)


def start_scheduler():
    """Inicia o APScheduler com job diario. Chamado no lifespan do FastAPI."""
    global _scheduler

    enabled = os.getenv("DAILY_SCRAPE_ENABLED", "true").lower()
    if enabled not in ("true", "1", "yes"):
        logger.info("[daily_scheduler] Scraping automatico desabilitado (DAILY_SCRAPE_ENABLED != true)")
        return

    hour = int(os.getenv("DAILY_GEN_HOUR", "8"))
    minute = int(os.getenv("DAILY_GEN_MINUTE", "50"))

    _scheduler = BackgroundScheduler(timezone="America/Sao_Paulo")
    _scheduler.add_job(
        _run_daily_scrape,
        trigger=CronTrigger(hour=hour, minute=minute, timezone="America/Sao_Paulo"),
        id="daily_scrape_job",
        name="Scraping Diario de Provas FCC",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info(f"[daily_scheduler] Scheduler iniciado. Proximo disparo: {hour:02d}:{minute:02d} BRT")


def stop_scheduler():
    """Para o scheduler graciosamente."""
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("[daily_scheduler] Scheduler encerrado.")


def get_scheduler() -> BackgroundScheduler | None:
    return _scheduler
