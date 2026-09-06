from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# @spec:AC-001
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
