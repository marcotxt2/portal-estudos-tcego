import os
import tempfile
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid

from app.database import get_db
from app.models import Module, UploadTask
from app.schemas import UploadTaskResponse
from app.services.extractor import process_pdf_background

router = APIRouter(prefix="/modules", tags=["modules"])

class ModuleOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

@router.get("/", response_model=list[ModuleOut])
def list_modules(db: Session = Depends(get_db)):
    modules = db.query(Module).order_by(Module.name).all()
    return modules

@router.post("/upload/")
def upload_pdf(
    background_tasks: BackgroundTasks,
    module_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    task_id = str(uuid.uuid4())
    
    # Salvar arquivo em um diretório persistente
    uploads_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, f"{task_id}.pdf")
    
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    upload_task = UploadTask(
        id=task_id,
        filename=file.filename,
        module_name=module_name,
        status="pending",
        extracted_questions_count=0
    )
    db.add(upload_task)
    db.commit()

    # Agendar a extração para rodar em background, passando o task_id. 
    # Não passamos db, a função deve criar sua própria sessão.
    background_tasks.add_task(process_pdf_background, file_path, module_name, task_id)
    
    return {"message": "Upload recebido! A extração está ocorrendo em segundo plano.", "task_id": task_id, "module_name": module_name}

@router.get("/uploads", response_model=list[UploadTaskResponse])
def list_uploads(db: Session = Depends(get_db)):
    tasks = db.query(UploadTask).order_by(UploadTask.created_at.desc()).limit(50).all()
    return tasks

@router.get("/upload/{task_id}/status", response_model=UploadTaskResponse)
def upload_status(task_id: str, db: Session = Depends(get_db)):
    task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.post("/upload/{task_id}/retry")
def retry_upload(task_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    task = db.query(UploadTask).filter(UploadTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != "error":
        raise HTTPException(status_code=400, detail="Task is not in error state")
        
    task.status = "processing"
    task.error_message = None
    db.commit()
    
    uploads_dir = os.path.join(os.getcwd(), "uploads")
    file_path = os.path.join(uploads_dir, f"{task_id}.pdf")
    
    background_tasks.add_task(process_pdf_background, file_path, task.module_name, task_id)
    return {"message": "Task retentada com sucesso.", "task_id": task_id}
