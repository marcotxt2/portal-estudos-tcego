"""
har_miner.py - Etapa 1 do fluxo resolucao-questoes-ia
Parseia o .har do QConcursos e exporta questions.json
@spec:AC-079
"""
import json
import base64
import re
import os
import html
from typing import Optional

HAR_PATH = os.path.join(
    os.path.dirname(__file__),
    "Scrapping QConcursos questoes 20 paginas  apenas.har",
)
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "questions.json")

# ---------------------------------------------------------------------------
# Helpers de extracao (stdlib pura, sem bs4)
# ---------------------------------------------------------------------------

def _clean(text: str) -> str:
    """Remove tags HTML, decode entidades e normaliza espacos."""
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_attr(block: str, attr: str) -> str:
    """Extrai o valor de um atributo HTML (suporta aspas simples e duplas)."""
    pattern = rf'{attr}=["\']([^"\']*)["\']'
    m = re.search(pattern, block, re.IGNORECASE | re.DOTALL)
    return m.group(1).strip() if m else ""


def _extract_between_tags(block: str, open_tag_pattern: str, close_tag: str) -> str:
    """Extrai conteudo entre a primeira ocorrencia de open_tag e close_tag."""
    m = re.search(open_tag_pattern + r"(.*?)" + close_tag, block, re.DOTALL | re.IGNORECASE)
    return m.group(1).strip() if m else ""


def parse_question_block(block: str) -> Optional[dict]:
    """
    Recebe o bloco HTML de uma unica questao e retorna o dict estruturado.
    Retorna None se o bloco nao conter uma questao valida.
    @spec:AC-079
    """
    # --- qc_id ---
    m_id = re.search(r'data-question-id=["\'](\d+)["\']', block)
    if not m_id:
        return None
    qc_id = m_id.group(1)

    # --- enunciado: preferir aria-label (mais limpo) ---
    enunciado = ""
    m_aria = re.search(
        r'class=["\'][^"\']*q-question-enunciation[^"\']*["\'][^>]*aria-label=["\']([^"\']{10,})["\']',
        block, re.DOTALL | re.IGNORECASE
    )
    if not m_aria:
        # Tentar o inverso (aria-label antes da classe)
        m_aria = re.search(
            r'aria-label=["\']([^"\']{10,})["\'][^>]*class=["\'][^"\']*q-question-enunciation',
            block, re.DOTALL | re.IGNORECASE
        )
    if m_aria:
        enunciado = html.unescape(m_aria.group(1)).strip()
    else:
        # Fallback: texto interno do div
        m_div = re.search(
            r'class=["\'][^"\']*q-question-enunciation[^"\']*["\'][^>]*>(.*?)</div>',
            block, re.DOTALL | re.IGNORECASE
        )
        if m_div:
            enunciado = _clean(m_div.group(1))

    if not enunciado:
        return None

    # --- alternativas: cada alternativa e um input[value=X] seguido de .q-item-enum ---
    alternativas: dict[str, str] = {}
    # Dividir por input radio do nome da questao
    option_pattern = re.compile(
        r'name=["\']answer-question-' + re.escape(qc_id) + r'["\'][^>]*value=["\']([A-E])["\']'
        r'.*?class=["\'][^"\']*q-item-enum[^"\']*["\'][^>]*>(.*?)</div>',
        re.DOTALL | re.IGNORECASE,
    )
    for m_opt in option_pattern.finditer(block):
        letra = m_opt.group(1)
        texto = _clean(m_opt.group(2))
        alternativas[letra] = texto

    # --- breadcrumb: disciplina (1o link) e topico (2o link) ---
    disciplina = ""
    topico = ""
    m_bc = re.search(
        r'class=["\'][^"\']*q-question-breadcrumb[^"\']*["\'][^>]*>(.*?)</div>',
        block, re.DOTALL | re.IGNORECASE
    )
    if m_bc:
        # Capturar texto de cada link, removendo spans internos
        links = re.findall(r'<a[^>]*>\s*([^<\n]+?)\s*(?:<span[^>]*>[^<]*</span>\s*)?</a>', m_bc.group(1))
        if links:
            disciplina = _clean(links[0])
        if len(links) > 1:
            topico = _clean(links[1])

    # --- info: ano, banca, orgao ---
    ano = None
    banca = ""
    orgao = ""
    m_info = re.search(
        r'class=["\'][^"\']*q-question-info[^"\']*["\'][^>]*>(.*?)</div>\s*<div',
        block, re.DOTALL | re.IGNORECASE
    )
    info_text = m_info.group(1) if m_info else block
    m_ano = re.search(r'Ano:\s*</strong>\s*(\d{4})', info_text, re.IGNORECASE)
    if m_ano:
        ano = int(m_ano.group(1))
    m_banca = re.search(r'Banca:\s*</strong>\s*<a[^>]*>([^<]+)</a>', info_text, re.IGNORECASE)
    if m_banca:
        banca = _clean(m_banca.group(1))
    m_orgao = re.search(r'<strong>[^<]*rg[^<]*</strong>\s*<a[^>]*>([^<]+)</a>', info_text, re.IGNORECASE)
    if m_orgao:
        orgao = _clean(m_orgao.group(1))

    # --- cargo: link dentro de .q-exams ---
    cargo = ""
    m_exams = re.search(
        r'class=["\'][^"\']*q-exams[^"\']*["\'][^>]*>(.*?)</span>',
        block, re.DOTALL | re.IGNORECASE
    )
    if m_exams:
        m_cargo_link = re.search(r'<a[^>]*>([^<]+)</a>', m_exams.group(1))
        if m_cargo_link:
            cargo = _clean(m_cargo_link.group(1))

    # --- source_url ---
    source_url = f"https://www.qconcursos.com/questoes-de-concursos/questoes/Q{qc_id}"

    return {
        "qc_id": qc_id,
        "enunciado": enunciado,
        "alternativas": alternativas,
        "correct_option": None,
        "is_ai_generated": True,
        "explanation": None,
        "disciplina": disciplina,
        "topico": topico,
        "banca": banca if banca else "FCC",
        "orgao": orgao,
        "ano": ano,
        "cargo": cargo,
        "source_url": source_url,
    }


def _decode_entry(entry: dict) -> str:
    """Decodifica o corpo da resposta HTTP de uma entrada do .har (base64 ou texto)."""
    content = entry["response"]["content"]
    text = content.get("text", "")
    if not text:
        return ""
    encoding = content.get("encoding", "")
    if encoding == "base64":
        try:
            return base64.b64decode(text).decode("utf-8", errors="replace")
        except Exception:
            return ""
    # Algumas ferramentas omitem encoding mesmo sendo base64; tentar detectar
    try:
        decoded = base64.b64decode(text).decode("utf-8", errors="replace")
        if decoded.strip().startswith("<"):
            return decoded
    except Exception:
        pass
    return text


def mine_har(har_path: str = HAR_PATH, output_path: str = OUTPUT_PATH) -> list[dict]:
    """
    Le o .har, extrai todas as questoes unicas e salva em output_path.
    @spec:AC-079
    """
    with open(har_path, encoding="utf-8") as f:
        har = json.load(f)

    entries = [
        e for e in har["log"]["entries"]
        if "qconcursos.com" in e["request"]["url"]
        and e["response"]["content"].get("mimeType", "").startswith("text/html")
    ]
    print(f"Entradas HTML do QConcursos: {len(entries)}")

    seen_ids: set[str] = set()
    questions: list[dict] = []

    for entry in entries:
        html_text = _decode_entry(entry)
        if not html_text:
            continue

        # Dividir o HTML nos blocos de questao pelo atributo data-question-id
        # Cada split retorna texto antes do primeiro match + alternados [text, id, text, id, ...]
        parts = re.split(r'(?=<[^>]*data-question-id=["\'](\d+)["\'])', html_text)

        for part in parts:
            m = re.search(r'data-question-id=["\'](\d+)["\']', part)
            if not m:
                continue
            qc_id = m.group(1)
            if qc_id in seen_ids:
                continue

            q = parse_question_block(part[:20000])  # limitar tamanho do bloco
            if q and q.get("alternativas") and len(q["alternativas"]) >= 4:
                seen_ids.add(qc_id)
                questions.append(q)

    print(f"Questoes unicas extraidas: {len(questions)}")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    print(f"Exportado: {output_path}")

    return questions


if __name__ == "__main__":
    mine_har()
