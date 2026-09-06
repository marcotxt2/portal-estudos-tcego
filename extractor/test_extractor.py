import os
os.environ["GEMINI_API_KEY"] = "dummy"

import json
from pdf_to_db import ExtractedContent, QuestionExtracted, TheoryExtracted

# @spec:AC-002
def test_schema_validation():
    json_str = """
    {
      "theories": [
        {"title": "T1", "content_markdown": "# T1", "topic_tag": "TI"}
      ],
      "questions": [
        {
          "statement": "O que é TI?",
          "options": {"A": "Tec", "B": "Tudo"},
          "correct_option": "A",
          "related_theory_text": "Tec é TI"
        }
      ]
    }
    """
    obj = ExtractedContent.model_validate_json(json_str)
    assert len(obj.theories) == 1
    assert len(obj.questions) == 1
    assert obj.theories[0].title == "T1"
    assert obj.questions[0].correct_option == "A"
