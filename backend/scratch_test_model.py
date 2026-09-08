import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
file_path = "/app/test.pdf"
uploaded = client.files.upload(path=file_path)
part = types.Part.from_uri(file_uri=uploaded.uri, mime_type="application/pdf")

prompt = """
Analise o PDF e retorne um JSON com:
{
  "theories": [{"title": "t", "content_markdown": "c", "topic_tag": null}],
  "questions": [{"statement": "s", "options": {"A": "1", "B": "2"}, "correct_option": "A", "related_theory_text": null, "is_ai_generated": false}]
}
"""

try:
    res = client.models.generate_content(
        model="gemini-flash-lite-latest",
        contents=[part, prompt],
        config={"response_mime_type": "application/json"}
    )
    print("SUCCESS:", res.text[:300])
except Exception as e:
    print("ERROR:", e)
finally:
    client.files.delete(name=uploaded.name)
