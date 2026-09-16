from app.models import Exam, Question
from app.schemas import ExamCreate, ExamResponse, QuestionResponse

# @spec:AC-074
def test_exam_model_and_question_source_type():
    exam = Exam(banca="FCC", cargo="Analista de TI", ano=2024)
    assert exam.banca == "FCC"
    assert exam.cargo == "Analista de TI"
    assert exam.ano == 2024

    q = Question(
        statement="Questao de Prova FCC",
        options={"A": "1", "B": "2"},
        correct_option="A",
        source_type="exam",
        question_number=10,
        needs_review=False
    )
    assert q.source_type == "exam"
    assert q.question_number == 10
    assert q.needs_review is False

# @spec:AC-075
def test_exam_question_pending_review_flag():
    q = Question(
        statement="Questao sem encaixe no edital",
        options={"A": "1", "B": "2"},
        correct_option="",
        source_type="exam",
        needs_review=True,
        suggested_materia="Direito",
        suggested_topico="Constitucional"
    )
    assert q.content_id is None
    assert q.needs_review is True
    assert q.suggested_materia == "Direito"
    assert q.suggested_topico == "Constitucional"
