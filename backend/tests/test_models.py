from app.models import Module, Question, UserProgress, Content
from app.schemas import ModuleBase, QuestionBase, UserProgressCreate

# @spec:AC-003
def test_models_importable():
    assert Module.__tablename__ == "modules"
    assert Question.__tablename__ == "questions"
    assert UserProgress.__tablename__ == "user_progress"
    assert Content.__tablename__ == "contents"

def test_schemas_instantiable():
    m = ModuleBase(name="Teste", day_of_week=1)
    assert m.name == "Teste"

# @spec:AC-001
def test_question_ai_generated_field():
    q = QuestionBase(
        statement="Teste",
        options={"A": "1", "B": "2"},
        correct_option="A",
        is_ai_generated=True
    )
    assert q.is_ai_generated is True

# @spec:AC-024 @spec:AC-027
def test_question_explanation_field():
    q = QuestionBase(
        statement="Teste",
        options={"A": "1", "B": "2"},
        correct_option="A",
        explanation="Texto corrido justificando as alternativas"
    )
    assert q.explanation == "Texto corrido justificando as alternativas"

# @spec:AC-030
def test_content_model():
    # Verifica a existência dos campos materia e topico e da tabela contents
    assert Content.__tablename__ == "contents"
    c = Content(materia="Banco de Dados", topico="SQL")
    assert c.materia == "Banco de Dados"
    assert c.topico == "SQL"

# @spec:AC-030
def test_question_content_id_field():
    q = Question(
        statement="Teste",
        options={"A": "1", "B": "2"},
        correct_option="A",
        content_id=1
    )
    assert q.content_id == 1

# @spec:AC-030
def test_schemas_content_response():
    from app.schemas import ContentResponse
    c = ContentResponse(id=1, materia="Banco de Dados", topico="SQL")
    assert c.id == 1
    assert c.materia == "Banco de Dados"
    assert c.topico == "SQL"

# @spec:AC-030
def test_schemas_question_response_content_id():
    from app.schemas import QuestionResponse
    from datetime import datetime
    q = QuestionResponse(
        id=1,
        statement="Teste",
        options={"A": "1"},
        correct_option="A",
        created_at=datetime.now(),
        content_id=10
    )
    assert q.content_id == 10
