from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, Boolean, JSON, UniqueConstraint, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    banca = Column(String(50), nullable=False, default="FCC")
    cargo = Column(String(255), nullable=False)
    ano = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    day_of_week = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Content(Base):
    __tablename__ = "contents"
    id = Column(Integer, primary_key=True, index=True)
    materia = Column(String(255), nullable=False)
    topico = Column(String(255), nullable=False)
    
    __table_args__ = (UniqueConstraint("materia", "topico", name="_materia_topico_uc"),)

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=True)
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="SET NULL"), nullable=True)
    statement = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_option = Column(String(10), nullable=False)

    explanation = Column(Text, nullable=True)
    is_ai_generated = Column(Boolean, nullable=False, default=False, server_default="false")
    source_file = Column(String(255), nullable=True)
    source_type = Column(String(20), nullable=False, default="slide", server_default="slide")
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="SET NULL"), nullable=True)
    question_number = Column(Integer, nullable=True)
    needs_review = Column(Boolean, nullable=False, default=False, server_default="false")
    suggested_materia = Column(String(255), nullable=True)
    suggested_topico = Column(String(255), nullable=True)
    generation_batch = Column(String(36), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    exam = relationship("Exam")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, default=1)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    chosen_option = Column(String(10), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    answered_at = Column(TIMESTAMP, server_default=func.now())

class UploadTask(Base):
    __tablename__ = "upload_tasks"

    id = Column(String(36), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    module_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    total_chunks = Column(Integer, nullable=False, default=0)
    processed_chunks = Column(Integer, nullable=False, default=0)
    extracted_questions_count = Column(Integer, nullable=False, default=0, server_default="0")
    error_message = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class GenerationLog(Base):
    __tablename__ = "generation_logs"

    id = Column(Integer, primary_key=True, index=True)
    run_date = Column(TIMESTAMP, server_default=func.now())
    questions_generated = Column(Integer, default=0)
    topics_covered = Column(JSON, nullable=True)
    status = Column(String(20), nullable=False)  # success, partial, error
    error_message = Column(Text, nullable=True)
    duration_seconds = Column(Float, nullable=True)

class ScrapedExam(Base):
    __tablename__ = "scraped_exams"

    id = Column(Integer, primary_key=True, index=True)
    source_url = Column(String(500), nullable=False, unique=True, index=True)
    cargo = Column(String(255), nullable=True)
    ano = Column(Integer, nullable=True)
    orgao = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False)  # success, error, skipped
    questions_extracted = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    scraped_at = Column(TIMESTAMP, server_default=func.now())
