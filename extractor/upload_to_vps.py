"""
upload_to_vps.py - Etapa 4 do fluxo resolucao-questoes-ia
Le questions.json completo e envia para a VPS via POST /api/questions/bulk/
@spec:AC-084
"""
import json
import os
import sys
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

QUESTIONS_PATH = os.path.join(os.path.dirname(__file__), "questions.json")
VPS_API_URL = os.getenv("VPS_API_URL", "").rstrip("/")
VPS_API_TOKEN = os.getenv("VPS_API_TOKEN", "")
LOGIN_URL = os.getenv("VPS_LOGIN_URL", f"{VPS_API_URL}/api/auth/token")
LOGIN_USERNAME = os.getenv("VPS_USERNAME", "")
LOGIN_PASSWORD = os.getenv("VPS_PASSWORD", "")


def get_token() -> str:
    """
    Autentica na VPS e retorna o JWT token.
    Usa VPS_API_TOKEN diretamente se ja configurado, ou faz login com VPS_USERNAME/VPS_PASSWORD.
    """
    if VPS_API_TOKEN:
        return VPS_API_TOKEN

    if not LOGIN_USERNAME or not LOGIN_PASSWORD:
        raise RuntimeError(
            "Configure VPS_API_TOKEN ou VPS_USERNAME + VPS_PASSWORD no .env"
        )

    payload = f"username={urllib.parse.quote(LOGIN_USERNAME)}&password={urllib.parse.quote(LOGIN_PASSWORD)}"
    req = urllib.request.Request(
        LOGIN_URL,
        data=payload.encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        return data["access_token"]


def upload(questions_path: str = QUESTIONS_PATH) -> dict:
    """
    Le questions.json e faz POST /api/questions/bulk/ na VPS.
    Retorna o relatorio de resultado.
    @spec:AC-084
    """
    if not VPS_API_URL:
        raise RuntimeError("VPS_API_URL nao configurado no .env")

    with open(questions_path, encoding="utf-8") as f:
        questions = json.load(f)

    print(f"Questoes carregadas: {len(questions)}")

    # Obter token
    token = get_token()

    # Montar payload — renomear campos do questions.json para o schema da API
    payload = json.dumps(questions).encode("utf-8")

    url = f"{VPS_API_URL}/api/questions/bulk/"
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )

    print(f"Enviando para: {url}")
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {body}") from exc

    # Relatorio
    print("\n=== Relatorio de Upload ===")
    print(f"Total enviado:  {result.get('total', '?')}")
    print(f"Inserido:       {result.get('inserted', '?')}")
    print(f"Ignorado (dup): {result.get('skipped', '?')}")
    errors = result.get("errors", [])
    print(f"Erros:          {len(errors)}")
    if errors:
        print("\nQuestoes com erro:")
        for e in errors:
            print(f"  idx={e.get('index')} url={e.get('source_url')} erro={e.get('error')}")

    return result


if __name__ == "__main__":
    import urllib.parse  # noqa: F401 - necessario para get_token
    try:
        upload()
    except Exception as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        sys.exit(1)
