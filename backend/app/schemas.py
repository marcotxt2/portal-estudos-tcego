from pydantic import BaseModel, ConfigDict
from typing import Dict, List, Optional, Any
from datetime import datetime

class ContentResponse(BaseModel):
    id: int
    materia: str
    topico: str
    model_config = ConfigDict(from_attributes=True)

class ModuleBase(BaseModel):
    name: str
    day_of_week: int
    description: Optional[str] = None

class ModuleResponse(ModuleBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ExamCreate(BaseModel):
    banca: str = "FCC"
    cargo: str
    ano: int

class ExamResponse(ExamCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class QuestionBase(BaseModel):
    module_id: Optional[int] = None
    content_id: Optional[int] = None
    statement: str
    options: Dict[str, str]
    correct_option: str

    explanation: Optional[str] = None
    is_ai_generated: bool = False
    source_file: Optional[str] = None
    source_type: str = "slide"
    exam_id: Optional[int] = None
    question_number: Optional[int] = None
    needs_review: bool = False
    exam: Optional[ExamResponse] = None

class QuestionResponse(QuestionBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserProgressCreate(BaseModel):
    question_id: int
    chosen_option: str
    is_correct: bool

class UserProgressResponse(UserProgressCreate):
    id: int
    answered_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UploadTaskResponse(BaseModel):
    id: str
    filename: str
    module_name: str
    status: str
    total_chunks: int
    processed_chunks: int
    extracted_questions_count: int = 0
    error_message: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PendingReviewResponse(BaseModel):
    id: int
    statement: str
    options: Dict[str, str]
    correct_option: Optional[str] = None
    suggested_materia: Optional[str] = None
    suggested_topico: Optional[str] = None
    question_number: Optional[int] = None
    exam_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class ReviewClassifyRequest(BaseModel):
    materia: Optional[str] = None
    topico: Optional[str] = None
    discard: bool = False


# ---------------------------------------------------------------------------
# Scraping / Geracao automatica
# ---------------------------------------------------------------------------

class GenerationLogResponse(BaseModel):
    id: int
    run_date: datetime
    questions_generated: int
    topics_covered: Optional[Any] = None
    status: str
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class ScrapedExamResponse(BaseModel):
    id: int
    source_url: str
    cargo: Optional[str] = None
    ano: Optional[int] = None
    orgao: Optional[str] = None
    status: str
    questions_extracted: int = 0
    error_message: Optional[str] = None
    scraped_at: datetime
    model_config = ConfigDict(from_attributes=True)

class GenerationStatsResponse(BaseModel):
    total_scraped_questions: int = 0
    total_exam_questions: int = 0
    total_slide_questions: int = 0
    total_scraped_exams: int = 0
    questions_by_materia: Dict[str, int] = {}
    last_run_date: Optional[datetime] = None
    last_run_status: Optional[str] = None
    last_run_count: int = 0
    scheduler_active: bool = False
    next_scheduled_run: Optional[str] = None


# ---------------------------------------------------------------------------
# Bulk upload (fluxo .har -> agentes -> VPS)
# @spec:AC-084, AC-085
# ---------------------------------------------------------------------------

class BulkQuestionItem(BaseModel):
    enunciado: str
    alternativas: Dict[str, str]
    correct_option: Optional[str] = None
    is_ai_generated: bool = True
    explanation: Optional[str] = None
    disciplina: str
    topico: str
    banca: str = "FCC"
    orgao: Optional[str] = None
    ano: Optional[int] = None
    cargo: Optional[str] = None
    source_url: Optional[str] = None


class BulkUploadResponse(BaseModel):
    total: int
    inserted: int
    skipped: int
    errors: List[Dict[str, Any]]
