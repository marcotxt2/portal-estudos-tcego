from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import app.models
from app.main import app
from app.database import get_db, Base

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
    yield
    app.dependency_overrides.clear()

client = TestClient(app)

# @spec:AC-003
def test_get_daily_session():
    response = client.get("/api/session/daily")
    assert response.status_code == 200
    assert response.json() == {"module": None, "theories": [], "questions": []}

def test_submit_answer():
    pass

# @spec:AC-004
def test_get_module_session():
    response = client.get("/api/session/module/999")
    assert response.status_code == 200
    assert response.json() == {"module": None, "theories": [], "questions": []}
