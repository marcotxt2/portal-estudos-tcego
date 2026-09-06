from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any
from app.database import get_db
from app.models import Module, Theory, Question, UserProgress
from app.schemas import TheoryResponse, QuestionResponse, ModuleResponse

router = APIRouter(prefix="/session", tags=["Session"])

@router.get("/daily", response_model=Dict[str, Any])
def get_daily_session(db: Session = Depends(get_db)):
    # Dia da semana atual (0 = Segunda, 6 = Domingo)
    current_day = datetime.today().weekday()
    
    # 1. Buscar o módulo mapeado para hoje (fallback pro primeiro se não houver exato)
    module = db.query(Module).filter(Module.day_of_week == current_day).first()
    if not module:
        module = db.query(Module).first()
        
    if not module:
        return {"module": None, "theories": [], "questions": []}
        
    # 2. Buscar teorias do módulo
    theories = db.query(Theory).filter(Theory.module_id == module.id).all()
    
    # 3. Lógica Spaced Repetition (Priorizar questões erradas)
    # Busca IDs das questões que o usuário errou
    wrong_answers = db.query(UserProgress.question_id).filter(
        UserProgress.is_correct == False
    ).subquery()
    
    # Busca as questões erradas pertencentes a este módulo
    priority_questions = db.query(Question).filter(
        Question.module_id == module.id,
        Question.id.in_(wrong_answers)
    ).limit(10).all()
    
    # Completa com outras questões que não foram respondidas
    answered_ids = db.query(UserProgress.question_id).subquery()
    new_questions = db.query(Question).filter(
        Question.module_id == module.id,
        Question.id.not_in(answered_ids)
    ).limit(20).all()
    
    questions = priority_questions + new_questions
    
    return {
        "module": ModuleResponse.model_validate(module),
        "theories": [TheoryResponse.model_validate(t) for t in theories],
        "questions": [QuestionResponse.model_validate(q) for q in questions]
    }

@router.get("/review", response_model=Dict[str, Any])
def get_review_session(db: Session = Depends(get_db)):
    # Retorna o histórico de erros do usuário para revisão
    wrong_answers = db.query(UserProgress).filter(
        UserProgress.is_correct == False
    ).order_by(UserProgress.answered_at.desc()).limit(20).all()
    
    review_items = []
    for progress in wrong_answers:
        q = db.query(Question).filter(Question.id == progress.question_id).first()
        if q:
            review_items.append({
                "question": QuestionResponse.model_validate(q),
                "chosen_option": progress.chosen_option,
                "answered_at": progress.answered_at
            })
            
    return {"review_items": review_items}
