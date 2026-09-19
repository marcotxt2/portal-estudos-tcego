from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, String, func
from typing import List, Optional

from app.database import get_db
from app.models import Content, Question, UserProgress, User
from app.schemas import ContentResponse, QuestionResponse, BulkQuestionItem, BulkUploadResponse
from app.auth import get_current_user

router = APIRouter(prefix="/questions", tags=["Questions"])

@router.get("/contents", response_model=List[ContentResponse])
def get_contents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contents = db.query(Content).all()
    return contents

@router.get("/", response_model=List[QuestionResponse])
def get_filtered_questions(
    materia: Optional[str] = None,
    content_ids: Optional[str] = None,  # comma-separated
    q: Optional[str] = None,
    source_file: Optional[str] = None,
    source_type: Optional[str] = None,
    apenas_erros: bool = False,
    nao_respondidas: bool = False,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Question).options(joinedload(Question.exam))

    # Ocultar questoes pendentes de revisao do banco principal
    query = query.filter(Question.needs_review == False)

    if source_file:
        query = query.filter(Question.source_file == source_file)

    if source_type:
        st_list = [st.strip() for st in source_type.split(",") if st.strip()]
        if len(st_list) == 1:
            query = query.filter(Question.source_type == st_list[0])
        elif len(st_list) > 1:
            query = query.filter(Question.source_type.in_(st_list))
    
    if materia:
        query = query.join(Content, Question.content_id == Content.id)
        query = query.filter(Content.materia == materia)
        
    if content_ids:
        ids_list = [int(cid) for cid in content_ids.split(",") if cid.strip().isdigit()]
        if ids_list:
            query = query.filter(Question.content_id.in_(ids_list))
            
    if q:
        search_str = f"%{q}%"
        # ILIKE is Postgres specific, so for tests in SQLite it might be tricky. Let's use ilike()
        query = query.filter(
            Question.statement.ilike(search_str) | Question.options.cast(String).ilike(search_str)
        )
        
    if apenas_erros:
        # Busca a ultima tentativa (max UserProgress.id) por questao para o usuario logado
        latest_attempts = db.query(
            UserProgress.question_id,
            func.max(UserProgress.id).label("max_id")
        ).filter(
            UserProgress.user_id == current_user.id
        ).group_by(
            UserProgress.question_id
        ).subquery()

        # Filtra apenas as questoes cuja tentativa mais recente foi errada (is_correct == False)
        wrong_questions = db.query(UserProgress.question_id).join(
            latest_attempts,
            UserProgress.id == latest_attempts.c.max_id
        ).filter(
            UserProgress.is_correct == False
        ).subquery()

        query = query.filter(Question.id.in_(select(wrong_questions)))

        
    if nao_respondidas:
        answered = db.query(UserProgress.question_id).filter(
            UserProgress.user_id == current_user.id
        ).subquery()
        query = query.filter(Question.id.notin_(select(answered)))
        
    if limit is not None and limit > 0:
        query = query.limit(limit)

    return query.all()


@router.post("/bulk/", response_model=BulkUploadResponse, status_code=200)
def bulk_upload_questions(
    items: List[BulkQuestionItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Recebe uma lista de questoes extraidas do .har (fluxo har_miner -> agentes)
    e insere no banco da VPS.
    - Resolve content_id via lookup em contents(materia=disciplina, topico=topico).
    - Deduplica por source_file (source_url do QConcursos).
    - Commit individual por questao para preservar progresso parcial.
    @spec:AC-084, AC-085
    """
    total = len(items)
    inserted = 0
    skipped = 0
    errors = []

    for idx, item in enumerate(items):
        try:
            # Deduplicacao por source_url (armazenado em source_file)
            if item.source_url:
                exists = db.query(Question.id).filter(
                    Question.source_file == item.source_url
                ).first()
                if exists:
                    skipped += 1
                    continue

            # Resolver content_id
            content_id = None
            if item.disciplina and item.topico:
                content = db.query(Content).filter(
                    Content.materia == item.disciplina,
                    Content.topico == item.topico,
                ).first()
                if content:
                    content_id = content.id

            question = Question(
                statement=item.enunciado,
                options=item.alternativas,
                correct_option=item.correct_option or "",
                explanation=item.explanation,
                is_ai_generated=item.is_ai_generated,
                content_id=content_id,
                source_type="qconcursos",
                source_file=item.source_url,
            )
            db.add(question)
            db.commit()
            db.refresh(question)
            inserted += 1

        except Exception as exc:
            db.rollback()
            errors.append({
                "index": idx,
                "source_url": item.source_url or "",
                "error": str(exc),
            })

    return BulkUploadResponse(
        total=total,
        inserted=inserted,
        skipped=skipped,
        errors=errors,
    )
