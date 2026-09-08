from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, String
from typing import List, Optional

from app.database import get_db
from app.models import Content, Question, UserProgress, User
from app.schemas import ContentResponse, QuestionResponse
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
    apenas_erros: bool = False,
    nao_respondidas: bool = False,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Question)
    
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
        wrong_answers = db.query(UserProgress.question_id).filter(
            UserProgress.is_correct == False,
            UserProgress.user_id == current_user.id
        ).subquery()
        query = query.filter(Question.id.in_(select(wrong_answers)))
        
    if nao_respondidas:
        answered = db.query(UserProgress.question_id).filter(
            UserProgress.user_id == current_user.id
        ).subquery()
        query = query.filter(Question.id.notin_(select(answered)))
        
    if limit is not None and limit > 0:
        query = query.limit(limit)

    return query.all()
