from pydantic import BaseModel, ConfigDict
from typing import Dict, Optional, Any
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


class QuestionBase(BaseModel):
    module_id: Optional[int] = None
    content_id: Optional[int] = None
    statement: str
    options: Dict[str, str]
    correct_option: str

    explanation: Optional[str] = None
    is_ai_generated: bool = False
    source_file: Optional[str] = None

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
