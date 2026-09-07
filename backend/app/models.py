from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, Boolean, JSON
from sqlalchemy.sql import func
from app.database import Base

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    day_of_week = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Theory(Base):
    __tablename__ = "theories"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    content_markdown = Column(Text, nullable=False)
    topic_tag = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=True)
    statement = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_option = Column(String(10), nullable=False)
    related_theory_id = Column(Integer, ForeignKey("theories.id", ondelete="SET NULL"), nullable=True)
    related_theory_text = Column(Text, nullable=True)
    is_ai_generated = Column(Boolean, nullable=False, default=False, server_default="false")
    created_at = Column(TIMESTAMP, server_default=func.now())

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
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
    error_message = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
