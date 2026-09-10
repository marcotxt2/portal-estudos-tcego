import pytest
import os
import uuid
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.models import UploadTask
from app.database import get_db

client = TestClient(app)

def override_get_db():
    mock_db = MagicMock()
    mock_task = MagicMock(spec=UploadTask)
    mock_task.id = "mock-task-id"
    mock_task.status = "error"
    mock_task.module_name = "Historia"
    
    mock_db.query.return_value.filter.return_value.first.return_value = mock_task
    yield mock_db

app.dependency_overrides[get_db] = override_get_db

@patch("app.routers.modules.os.makedirs")
@patch("app.routers.modules.open", create=True)
@patch("app.routers.modules.BackgroundTasks.add_task")
def test_upload_salva_na_pasta_persistente_spec_AC_033_AC_034(mock_add_task, mock_open, mock_makedirs):
    """
    @spec:AC-033 @spec:AC-034 - O arquivo original é salvo em /app/uploads para permitir
    retry posterior.
    """
    response = client.post(
        "/api/modules/upload/",
        data={"module_name": "Matematica"},
        files={"file": ("dummy.pdf", b"pdf content", "application/pdf")}
    )
    
    assert response.status_code == 200
    task_id = response.json()["task_id"]
    
    called_path = mock_open.call_args[0][0]
    assert "uploads" in called_path
    assert called_path.endswith(f"{task_id}.pdf")
    
    mock_add_task.assert_called_once()

@patch("app.routers.modules.BackgroundTasks.add_task")
def test_retry_route_dispara_worker_spec_AC_033(mock_add_task):
    """
    @spec:AC-033 - Rota POST /api/modules/upload/{task_id}/retry busca task com erro e relança background_task.
    """
    # Usaremos o mock-task-id definido no override_get_db
    response = client.post("/api/modules/upload/mock-task-id/retry")
    
    assert response.status_code == 200
    assert response.json() == {"message": "Task retentada com sucesso.", "task_id": "mock-task-id"}
    
    mock_add_task.assert_called_once()
    called_args = mock_add_task.call_args[0]
    assert "uploads" in called_args[1]
    assert called_args[1].endswith("mock-task-id.pdf")

@patch("app.services.extractor.pypdf.PdfWriter")
@patch("app.services.extractor.pypdf.PdfReader")
@patch("app.services.extractor.os.path.exists", return_value=True)
@patch("app.services.extractor.os.remove")
@patch("app.services.extractor.extract_content_with_gemini")
@patch("app.services.extractor.SessionLocal")
def test_process_pdf_background_resume_logic_spec_AC_033_034_035(
    mock_session_local, mock_extract, mock_remove, mock_exists, mock_reader, mock_writer_class
):
    """
    @spec:AC-033 @spec:AC-034 @spec:AC-035 - Valida as lógicas de T-005.
    - chunk_size = 8
    - Resume a partir do processed_chunks
    - Remoção dos arquivos temporários e preservação do arquivo persistente em caso de erro
    """
    from app.services.extractor import process_pdf_background
    mock_db = MagicMock()
    mock_session_local.return_value = mock_db
    
    mock_task = MagicMock(spec=UploadTask)
    mock_task.id = "mock-task-id"
    # Simulando um PDF longo onde já processamos 2 chunks
    mock_task.processed_chunks = 2 
    mock_task.status = "processing"
    
    mock_db.query.return_value.filter.return_value.first.return_value = mock_task
    
    # Criamos mock para PdfReader
    mock_pdf_instance = MagicMock()
    # 20 páginas = 3 chunks (se chunk_size for 8: 8, 8, 4)
    mock_pdf_instance.pages = [MagicMock() for _ in range(20)]
    mock_reader.return_value = mock_pdf_instance
    
    # Extração normal retorna um objeto com questions vazias
    mock_extracted = MagicMock()
    mock_extracted.questions = []
    mock_extract.return_value = mock_extracted
    
    # Executa a função
    process_pdf_background("/app/uploads/mock-task-id.pdf", "Matematica", "mock-task-id")
    
    # Validações AC-035: chunk_size deve ser 8
    # Ao criar chunks de 20 páginas, teremos i=0, i=8, i=16. 
    # mock_writer_class foi instanciado 3 vezes?
    assert mock_writer_class.call_count == 3
    
    # Validações AC-033: se já tinha processado 2, mock_extract só deve ser chamado 1 vez (pro último chunk)
    assert mock_extract.call_count == 1
    
    # Validações AC-034: como a extração teve sucesso, status virou "completed" 
    # e mock_remove deve ter sido chamado para os 3 chunks + o PDF original
    assert mock_task.status == "completed"
    
    removed_files = [call[0][0] for call in mock_remove.call_args_list]
    assert "/app/uploads/mock-task-id.pdf" in removed_files
    # e deve ter 4 remoções (3 chunks + 1 pdf original)
    assert mock_remove.call_count == 4
