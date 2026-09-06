from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserProgress
from app.schemas import UserProgressCreate, UserProgressResponse

router = APIRouter(prefix="/answers", tags=["Answers"])

@router.post("/", response_model=UserProgressResponse)
def submit_answer(answer: UserProgressCreate, db: Session = Depends(get_db)):
    db_progress = UserProgress(
        question_id=answer.question_id,
        chosen_option=answer.chosen_option,
        is_correct=answer.is_correct
    )
    db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    return db_progress
