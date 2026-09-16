from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, Question, UserProgress
from app.main import app
from app.database import get_db, Base
from app.auth import get_current_user

from sqlalchemy.pool import StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
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

# @spec:AC-003
def test_get_daily_session():
    response = client.get("/api/session/daily")
    assert response.status_code == 200
    assert response.json() == {"module": None, "questions": []}

def test_submit_answer():
    pass

# @spec:AC-004
def test_get_module_session():
    response = client.get("/api/session/module/999")
    assert response.status_code == 200
    assert response.json() == {"module": None, "questions": []}

# @spec:AC-028
def test_get_questions_contents():
    response = client.get("/api/questions/contents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# @spec:AC-029 @spec:AC-031
def test_get_questions():
    response = client.get("/api/questions/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_questions_with_filters():
    response = client.get("/api/questions/?materia=Mat&content_ids=1,2&q=teste&apenas_erros=true")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# @spec:AC-048
def test_get_questions_with_nao_respondidas():
    response = client.get("/api/questions/?nao_respondidas=true")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# @spec:AC-032
def test_get_review_with_filters():
    response = client.get("/api/session/review?materia=Mat&content_ids=1,2")
    assert response.status_code == 200
    assert "questions" in response.json()

# @spec:AC-068
def test_apenas_erros_considers_latest_attempt():
    db = TestingSessionLocal()
    # Criar questao de teste
    q = Question(
        statement="Questao Teste AC-068",
        options={"A": "Opcao A", "B": "Opcao B"},
        correct_option="A"
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    # 1a tentativa: Resposta incorreta
    p1 = UserProgress(
        user_id=1,
        question_id=q.id,
        chosen_option="B",
        is_correct=False
    )
    db.add(p1)
    db.commit()

    # Deve retornar a questao no filtro apenas_erros
    res1 = client.get("/api/questions/?apenas_erros=true")
    assert res1.status_code == 200
    q_ids = [item["id"] for item in res1.json()]
    assert q.id in q_ids

    # 2a tentativa: Resposta correta (tentativa mais recente)
    p2 = UserProgress(
        user_id=1,
        question_id=q.id,
        chosen_option="A",
        is_correct=True
    )
    db.add(p2)
    db.commit()

    # Nao deve mais retornar a questao no filtro apenas_erros
    res2 = client.get("/api/questions/?apenas_erros=true")
    assert res2.status_code == 200
    q_ids_updated = [item["id"] for item in res2.json()]
    assert q.id not in q_ids_updated
    db.close()

