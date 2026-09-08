# @spec:AC-016
import io
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.models import UploadTask

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

def _make_pdf_bytes(content: str) -> bytes:
    return (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n"
        b"xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n"
        b"0000000058 00000 n\n0000000115 00000 n\n"
        b"trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF"
    )

def test_multiple_uploads_are_independent():
    """
    Dado que faco 2 uploads quase simultaneos para o endpoint,
    Entao 2 UploadTasks distintos com IDs unicos sao criados no banco de dados,
    Garantindo que nao ha acoplamento entre as requisicoes do upload multiplo.
    """
    with patch("app.routers.modules.process_pdf_background"):
        response1 = client.post(
            "/api/modules/upload/",
            data={"module_name": "Materia Teste 1"},
            files={"file": ("teste1.pdf", io.BytesIO(_make_pdf_bytes("pdf1")), "application/pdf")},
        )
        response2 = client.post(
            "/api/modules/upload/",
            data={"module_name": "Materia Teste 2"},
            files={"file": ("teste2.pdf", io.BytesIO(_make_pdf_bytes("pdf2")), "application/pdf")},
        )
    
    assert response1.status_code == 200
    assert response2.status_code == 200

    body1 = response1.json()
    body2 = response2.json()

    task1_id = body1.get("task_id")
    task2_id = body2.get("task_id")

    assert task1_id is not None
    assert task2_id is not None
    assert task1_id != task2_id

    db = TestingSessionLocal()
    task1 = db.query(UploadTask).filter(UploadTask.id == task1_id).first()
    task2 = db.query(UploadTask).filter(UploadTask.id == task2_id).first()
    db.close()

    assert task1 is not None
    assert task2 is not None
    assert task1.module_name == "Materia Teste 1"
    assert task2.module_name == "Materia Teste 2"
