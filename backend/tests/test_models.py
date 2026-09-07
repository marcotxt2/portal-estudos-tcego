from app.models import Module, Theory, Question, UserProgress
from app.schemas import ModuleBase, TheoryBase, QuestionBase, UserProgressCreate

# @spec:AC-003
def test_models_importable():
    assert Module.__tablename__ == "modules"
    assert Theory.__tablename__ == "theories"
    assert Question.__tablename__ == "questions"
    assert UserProgress.__tablename__ == "user_progress"

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
