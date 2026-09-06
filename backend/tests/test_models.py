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
