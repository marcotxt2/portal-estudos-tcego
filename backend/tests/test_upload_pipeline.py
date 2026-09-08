"""
Testes de integracao para a feature: correcao-pipeline-upload
Refs: AC-005, AC-006, AC-007, AC-008
"""
import io
import uuid
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.main import app
from app.database import get_db, Base
from app.models import UploadTask, Module, Theory, Question
from app.services.extractor import ExtractedContent, TheoryExtracted, QuestionExtracted

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


import pytest

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_deps():
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()

client = TestClient(app)


def _make_pdf_bytes() -> bytes:
    return (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n"
        b"xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n"
        b"0000000058 00000 n\n0000000115 00000 n\n"
        b"trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF"
    )


# @spec:AC-005
def test_upload_cria_upload_task_e_retorna_task_id():
    """
    Dado que envio um PDF valido com materia selecionada,
    Quando POST /api/modules/upload/ e chamado,
    Entao a resposta deve conter task_id e o UploadTask deve existir com status pending.
    """
    with patch("app.routers.modules.process_pdf_background"):
        response = client.post(
            "/api/modules/upload/",
            data={"module_name": "Materia Teste AC-005"},
            files={"file": ("teste.pdf", io.BytesIO(_make_pdf_bytes()), "application/pdf")},
        )
    assert response.status_code == 200
    body = response.json()
    assert "task_id" in body
    assert body["task_id"] != ""

    db = TestingSessionLocal()
    task = db.query(UploadTask).filter(UploadTask.id == body["task_id"]).first()
    db.close()
    assert task is not None
    assert task.status == "pending"
    assert task.module_name == "Materia Teste AC-005"


# @spec:AC-006
def test_status_endpoint_retorna_task_existente():
    """
    Dado que existe um UploadTask com status processing,
    Quando GET /api/modules/upload/{task_id}/status e chamado,
    Entao retorna 200 com campos status, total_chunks e processed_chunks.
    """
    db = TestingSessionLocal()
    task_id = str(uuid.uuid4())
    db.add(UploadTask(
        id=task_id, filename="t.pdf", module_name="M", status="processing",
        total_chunks=3, processed_chunks=1
    ))
    db.commit()
    db.close()

    response = client.get(f"/api/modules/upload/{task_id}/status")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "processing"
    assert body["total_chunks"] == 3
    assert body["processed_chunks"] == 1
    assert body["error_message"] is None


# @spec:AC-006
def test_status_endpoint_404_para_task_inexistente():
    response = client.get(f"/api/modules/upload/{uuid.uuid4()}/status")
    assert response.status_code == 404


# @spec:AC-007
def test_session_module_retorna_conteudo_inserido():
    """
    Dado que existem teorias e questoes no banco para um modulo,
    Quando GET /api/session/module/{module_id} e chamado,
    Entao retorna as teorias e questoes daquele modulo.
    """
    db = TestingSessionLocal()
    module = Module(name="Modulo AC-007", day_of_week=0)
    db.add(module)
    db.commit()
    db.refresh(module)
    module_id = module.id  # captura antes de fechar a sessao
    db.add(Theory(module_id=module_id, title="Teoria AC-007", content_markdown="# C"))
    db.add(Question(
        module_id=module_id, statement="Questao AC-007",
        options={"Certo": "Certo", "Errado": "Errado"},
        correct_option="Certo", is_ai_generated=False
    ))
    db.commit()
    db.close()

    response = client.get(f"/api/session/module/{module_id}")
    assert response.status_code == 200
    body = response.json()
    assert len(body["theories"]) >= 1
    assert len(body["questions"]) >= 1
    assert any(t["title"] == "Teoria AC-007" for t in body["theories"])
    assert any(q["statement"] == "Questao AC-007" for q in body["questions"])


# @spec:AC-008
def test_status_endpoint_expoe_error_message():
    """
    Dado que o UploadTask tem status error com error_message preenchido,
    Quando GET /api/modules/upload/{task_id}/status e chamado,
    Entao a resposta inclui o error_message para exibicao no frontend.
    """
    db = TestingSessionLocal()
    task_id = str(uuid.uuid4())
    db.add(UploadTask(
        id=task_id, filename="falha.pdf", module_name="M", status="error",
        total_chunks=2, processed_chunks=0,
        error_message="Falha ao processar chunk: validation error"
    ))
    db.commit()
    db.close()

    response = client.get(f"/api/modules/upload/{task_id}/status")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "error"
    assert body["error_message"] is not None
    assert "Falha ao processar chunk" in body["error_message"]
