from pydantic import BaseModel, ConfigDict
from typing import Dict, Optional, Any
from datetime import datetime

class ModuleBase(BaseModel):
    name: str
    day_of_week: int
    description: Optional[str] = None

class ModuleResponse(ModuleBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TheoryBase(BaseModel):
    module_id: Optional[int] = None
    title: str
    content_markdown: str
    topic_tag: Optional[str] = None

class TheoryResponse(TheoryBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class QuestionBase(BaseModel):
    module_id: Optional[int] = None
    statement: str
    options: Dict[str, str]
    correct_option: str
    related_theory_id: Optional[int] = None
    related_theory_text: Optional[str] = None
    is_ai_generated: bool = False

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
