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
from app.auth import get_current_user
from app.models import User
from app.models import UploadTask, Module, Question
from app.services.extractor import ExtractedContent, QuestionExtracted

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
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="testuser")
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


# @spec:AC-007 @spec:AC-026 @spec:AC-027
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
    db.add(Question(
        module_id=module_id, statement="Questao AC-007",
        options={"Certo": "Certo", "Errado": "Errado"},
        correct_option="Certo", is_ai_generated=False,
        explanation="Explicação em string única"
    ))
    db.commit()
    db.close()

    response = client.get(f"/api/session/module/{module_id}")
    assert response.status_code == 200
    body = response.json()
    assert len(body["questions"]) >= 1
    
    question_found = next(q for q in body["questions"] if q["statement"] == "Questao AC-007")
    assert question_found["explanation"] == "Explicação em string única"


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


def test_parse_extracted_json_formats():
    """Valida que parse_extracted_json aceita tanto formato objeto quanto lista crua ou blocos markdown."""
    from app.services.extractor import parse_extracted_json
    
    # 1. Formato padrão de objeto
    json_obj = '{"questions": [{"statement": "Q1", "options": {"A": "1"}, "correct_option": "A"}]}'
    res1 = parse_extracted_json(json_obj)
    assert len(res1.questions) == 1
    assert res1.questions[0].statement == "Q1"

    # 2. Formato de lista crua devolvida pelo Gemini
    json_list = '[{"statement": "Q2", "options": {"A": "2"}, "correct_option": "A"}]'
    res2 = parse_extracted_json(json_list)
    assert len(res2.questions) == 1
    assert res2.questions[0].statement == "Q2"

    # 3. Formato com bloco markdown
    json_md = '```json\n[{"statement": "Q3", "options": {"B": "3"}, "correct_option": "B"}]\n```'
    res3 = parse_extracted_json(json_md)
    assert len(res3.questions) == 1
    assert res3.questions[0].statement == "Q3"


def test_uploads_list_and_extracted_questions_count():
    """
    Valida que GET /api/modules/uploads lista tarefas e que extracted_questions_count e retornado.
    """
    db = TestingSessionLocal()
    task_id = str(uuid.uuid4())
    db.add(UploadTask(
        id=task_id,
        filename="apostila_tce.pdf",
        module_name="Engenharia de Software",
        status="completed",
        total_chunks=2,
        processed_chunks=2,
        extracted_questions_count=12
    ))
    db.commit()
    db.close()

    response = client.get("/api/modules/uploads")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    task_item = next((t for t in data if t["id"] == task_id), None)
    assert task_item is not None
    assert task_item["filename"] == "apostila_tce.pdf"
    assert task_item["extracted_questions_count"] == 12


def test_question_source_file_persisted_and_filtered():
    """
    Valida que Question persiste source_file e que GET /api/questions/ permite filtrar por source_file.
    """
    db = TestingSessionLocal()
    q1 = Question(
        statement="Questão originária do PDF 1",
        options={"A": "Opção 1"},
        correct_option="A",
        source_file="edital_2026.pdf"
    )
    q2 = Question(
        statement="Questão originária do PDF 2",
        options={"B": "Opção 2"},
        correct_option="B",
        source_file="legislacao_go.pdf"
    )
    db.add_all([q1, q2])
    db.commit()
    db.close()

    # Filtra por edital_2026.pdf
    res1 = client.get("/api/questions/?source_file=edital_2026.pdf")
    assert res1.status_code == 200
    items1 = res1.json()
    assert any(q["statement"] == "Questão originária do PDF 1" for q in items1)
    assert not any(q["statement"] == "Questão originária do PDF 2" for q in items1)
    found_q = next(q for q in items1 if q["statement"] == "Questão originária do PDF 1")
    assert found_q["source_file"] == "edital_2026.pdf"


