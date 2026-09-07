import os
import tempfile
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import Module
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
    # Salvar arquivo em um diretório temporário
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, file.filename)
    
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    # Agendar a extração para rodar em background
    background_tasks.add_task(process_pdf_background, file_path, module_name, db)
    
    return {"message": "Upload recebido! A extração está ocorrendo em segundo plano.", "module_name": module_name}
