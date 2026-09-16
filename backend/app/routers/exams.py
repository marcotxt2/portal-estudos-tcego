import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Exam, Question, UploadTask, Content
from app.schemas import ExamResponse, PendingReviewResponse, ReviewClassifyRequest, UploadTaskResponse
from app.auth import get_current_user
from app.models import User
from app.services.exam_processor import process_exam_background

router = APIRouter(prefix="/exams", tags=["Exams"])


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

@router.post("/upload/")
def upload_exam(
    background_tasks: BackgroundTasks,
    banca: str = Form(default="FCC"),
    cargo: str = Form(...),
    ano: int = Form(...),
    caderno: UploadFile = File(...),
    gabarito: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Criar registro do exam
    exam = Exam(banca=banca, cargo=cargo, ano=ano)
    db.add(exam)
    db.commit()
    db.refresh(exam)

    task_id = str(uuid.uuid4())
    uploads_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    caderno_path = os.path.join(uploads_dir, f"{task_id}_caderno.pdf")
    gabarito_path = os.path.join(uploads_dir, f"{task_id}_gabarito.pdf")

    with open(caderno_path, "wb") as f:
        f.write(caderno.file.read())
    with open(gabarito_path, "wb") as f:
        f.write(gabarito.file.read())

    upload_task = UploadTask(
        id=task_id,
        filename=caderno.filename,
        module_name=f"{banca} | {cargo} | {ano}",
        status="pending",
        extracted_questions_count=0,
    )
    db.add(upload_task)
    db.commit()

    background_tasks.add_task(
        process_exam_background,
        caderno_path,
        gabarito_path,
        exam.id,
        task_id,
    )

    return {
        "message": "Upload recebido. A extracao esta ocorrendo em segundo plano.",
        "task_id": task_id,
        "exam_id": exam.id,
    }


# ---------------------------------------------------------------------------
# Listagem de provas
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[ExamResponse])
def list_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Exam).order_by(Exam.ano.desc(), Exam.cargo).all()


# ---------------------------------------------------------------------------
# Revisao de questoes pendentes
# ---------------------------------------------------------------------------

@router.get("/pending-review/", response_model=List[PendingReviewResponse])
def list_pending_review(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Question)
        .filter(Question.needs_review == True)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/pending-review/count")
def count_pending_review(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Question).filter(Question.needs_review == True).count()
    return {"count": total}


@router.patch("/pending-review/{question_id}")
def classify_or_discard(
    question_id: int,
    body: ReviewClassifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Questao nao encontrada.")

    if body.discard:
        db.delete(question)
        db.commit()
        return {"message": "Questao descartada."}

    if not body.materia or not body.topico:
        raise HTTPException(status_code=400, detail="Informe materia e topico ou marque discard=true.")

    content = db.query(Content).filter(
        Content.materia == body.materia,
        Content.topico == body.topico,
    ).first()
    if not content:
        raise HTTPException(status_code=400, detail="Materia/topico nao encontrado na lista canonicа.")

    question.content_id = content.id
    question.needs_review = False
    question.suggested_materia = None
    question.suggested_topico = None
    db.commit()
    return {"message": "Questao classificada com sucesso."}
