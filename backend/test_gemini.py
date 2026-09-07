import os
from google import genai

key = os.getenv("GEMINI_API_KEY")
print("KEY set:", bool(key), "| len:", len(key) if key else 0)

client = genai.Client(api_key=key)

resp = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Retorne apenas este JSON sem alterar nada: {\"theories\": [], \"questions\": []}",
    config={"response_mime_type": "application/json"}
)
print("RESPOSTA:", resp.text[:300])
