from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models import Module, Question, UserProgress, Content, User
from app.schemas import QuestionResponse, ModuleResponse
from app.auth import get_current_user

router = APIRouter(prefix="/session", tags=["Session"])

@router.get("/daily", response_model=Dict[str, Any])
def get_daily_session(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Dia da semana atual (0 = Segunda, 6 = Domingo)
    current_day = datetime.today().weekday()
    
    # 1. Buscar o módulo mapeado para hoje (fallback pro primeiro se não houver exato)
    module = db.query(Module).filter(Module.day_of_week == current_day).first()
    if not module:
        module = db.query(Module).first()
        
    if not module:
        return {"module": None, "questions": []}

    
    # 3. Lógica Spaced Repetition (Priorizar questões erradas)
    # Busca IDs das questões que o usuário errou
    wrong_answers = db.query(UserProgress.question_id).filter(
        UserProgress.is_correct == False,
        UserProgress.user_id == current_user.id
    ).subquery()
    
    # Busca as questões erradas pertencentes a este módulo
    priority_questions = db.query(Question).filter(
        Question.module_id == module.id,
        Question.id.in_(select(wrong_answers))
    ).limit(10).all()
    
    # Completa com outras questões que não foram respondidas
    answered_ids = db.query(UserProgress.question_id).filter(
        UserProgress.user_id == current_user.id
    ).subquery()
    new_questions = db.query(Question).filter(
        Question.module_id == module.id,
        Question.id.not_in(select(answered_ids))
    ).limit(20).all()
    
    questions = priority_questions + new_questions
    
    return {
        "module": ModuleResponse.model_validate(module),
        "questions": [QuestionResponse.model_validate(q) for q in questions]
    }

@router.get("/module/{module_id}", response_model=Dict[str, Any])
def get_module_session(module_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        return {"module": None, "questions": []}

    
    wrong_answers = db.query(UserProgress.question_id).filter(
        UserProgress.is_correct == False,
        UserProgress.user_id == current_user.id
    ).subquery()
    
    priority_questions = db.query(Question).filter(
        Question.module_id == module.id,
        Question.id.in_(select(wrong_answers))
    ).limit(10).all()
    
    answered_ids = db.query(UserProgress.question_id).filter(
        UserProgress.user_id == current_user.id
    ).subquery()
    new_questions = db.query(Question).filter(
        Question.module_id == module.id,
        Question.id.not_in(select(answered_ids))
    ).limit(20).all()
    
    questions = priority_questions + new_questions
    
    return {
        "module": ModuleResponse.model_validate(module),
        "questions": [QuestionResponse.model_validate(q) for q in questions]
    }

@router.get("/review", response_model=Dict[str, Any])
def get_review_session(
    materia: Optional[str] = None,
    content_ids: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retorna o histórico de erros do usuário para revisão
    wrong_answers_query = db.query(UserProgress).filter(
        UserProgress.is_correct == False,
        UserProgress.user_id == current_user.id
    )
    
    if materia or content_ids:
        wrong_answers_query = wrong_answers_query.join(
            Question, UserProgress.question_id == Question.id
        ).join(
            Content, Question.content_id == Content.id
        )
        
        if materia:
            wrong_answers_query = wrong_answers_query.filter(Content.materia == materia)
            
        if content_ids:
            ids_list = [int(cid) for cid in content_ids.split(",") if cid.strip().isdigit()]
            if ids_list:
                wrong_answers_query = wrong_answers_query.filter(Question.content_id.in_(ids_list))
                
    wrong_answers = wrong_answers_query.order_by(UserProgress.answered_at.desc()).limit(20).all()
    
    review_items = []
    for progress in wrong_answers:
        q = db.query(Question).filter(Question.id == progress.question_id).first()
        if q:
            review_items.append({
                "question": QuestionResponse.model_validate(q),
                "chosen_option": progress.chosen_option,
                "answered_at": progress.answered_at
            })
            
    # Para ser compativel com o json() no teste da master sem quebrar contratos, 
    # garantimos que exista a chave 'questions' com apenas a lista de questions
    return {
        "review_items": review_items,
        "questions": [item["question"] for item in review_items]
    }
