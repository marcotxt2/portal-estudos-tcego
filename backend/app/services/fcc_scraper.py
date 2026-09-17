"""
Scraper oficial de provas e editais da FCC (concursosfcc.com.br).

Navega diretamente pelo portal oficial da FCC e por fontes abertas de provas da FCC,
extraindo arquivos PDF diretos com HTTP 200 OK sem bloqueios de captcha.
"""

import os
import re
import time
import logging
import tempfile
from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup

from app.services.edital_config import matches_cargo_keyword

logger = logging.getLogger("fcc_scraper")

FCC_MAIN_URL = "https://www.concursosfcc.com.br/concursos/"
RATE_LIMIT_SECONDS = 1.5

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.5",
}


@dataclass
class ScrapedExamMeta:
    url: str          # URL direta do PDF
    cargo: str        # Nome do cargo/concurso
    ano: int | None   # Ano do concurso
    orgao: str        # Orgao (ex: TCE-GO, TRT-1, MPE-AL)


# Palavras-chave de documentos administrativos, resultados, editais e discursivas que DEVEM ser ignorados
EXCLUDED_KEYWORDS = [
    "edital",
    "comunicado",
    "isencao",
    "retificacao",
    "local_de_prova",
    "locais_de_prova",
    "respostas_impugnac",
    "resultado",
    "discursiva",
    "gabarito",
    "gabaritos",
    "lista",
    "recurso",
    "recursos",
    "impugnacao",
    "divulgacao",
    "relacao",
    "convocacao",
    "desempate",
    "heteroidentificacao",
    "comprovante",
    "inscricoes",
    "deferidas",
    "deferimento",
    "anulada",
    "anuladas",
    "analise",
    "candidatos",
]


def _is_edital_or_admin_doc(text: str) -> bool:
    """Verifica se o texto se refere a um edital, resultado ou documento administrativo."""
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in EXCLUDED_KEYWORDS)


# Fontes de sementes diretas e verificadas de CADERNOS DE PROVAS E QUESTOES da FCC
SEED_EXAMS: list[ScrapedExamMeta] = []


def _extract_contest_links_from_portal(html: str) -> list[tuple[str, str]]:
    """Extrai (nome_concurso, url_concurso) do portal oficial da FCC."""
    soup = BeautifulSoup(html, "html.parser")
    contests = []

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if "/concursos/" in href and href.endswith("index.html"):
            if not href.startswith("http"):
                href = "https://www.concursosfcc.com.br" + (href if href.startswith("/") else f"/{href}")
            title = a.get_text(strip=True)
            if title and len(title) > 3:
                contests.append((title, href))

    return contests


def _extract_pdfs_from_contest_page(contest_name: str, contest_url: str, html: str) -> list[ScrapedExamMeta]:
    """Extrai links de arquivos PDF DE PROVAS E QUESTOES (excluindo editais) da FCC."""
    soup = BeautifulSoup(html, "html.parser")
    results = []

    # Detectar ano no titulo do concurso ou URL
    year_match = re.search(r"20\d{2}", contest_name + contest_url)
    ano = int(year_match.group(0)) if year_match else 2025

    # Detectar sigla do orgao
    orgao_match = re.search(r"(TCE|TRT|TJ|MPE|DPE|SEFAZ|PGE|ALE|AL)[-\s\/\w]{0,10}", contest_name, re.IGNORECASE)
    orgao = orgao_match.group(0).upper() if orgao_match else "FCC"

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        text = a.get_text(strip=True)

        # Se o link contem um arquivo PDF direto ou parametro file=http...pdf
        pdf_url = None
        if "file=" in href and ".pdf" in href.lower():
            match = re.search(r"file=(https?://[^\s\"'&]+\.pdf)", href, re.IGNORECASE)
            if match:
                pdf_url = match.group(1)
        elif href.lower().endswith(".pdf"):
            if not href.startswith("http"):
                pdf_url = "https://www.concursosfcc.com.br" + (href if href.startswith("/") else f"/{href}")
            else:
                pdf_url = href

        if pdf_url:
            candidate_text = f"{contest_name} {text} {pdf_url}"

            # EXCLUIR ESTRITAMENTE EDITAIS E DOCUMENTOS ADMINISTRATIVOS
            if _is_edital_or_admin_doc(candidate_text):
                logger.debug(f"[fcc_scraper] Ignorando edital/documento administrativo: {pdf_url}")
                continue

            # FILTRAR EXCLUSIVAMENTE CARGOS DE TI (PROVAS OBJETIVAS REAIS)
            if matches_cargo_keyword(candidate_text):
                cargo_title = f"{contest_name} - {text}" if text else contest_name
                results.append(
                    ScrapedExamMeta(
                        url=pdf_url,
                        cargo=cargo_title[:250],
                        ano=ano,
                        orgao=orgao[:50],
                    )
                )

    return results


def discover_exam_urls(max_pages: int = 10) -> list[ScrapedExamMeta]:
    """
    Descobre provas e editais da FCC navegando no portal oficial concursosfcc.com.br.
    Combina com a lista de sementes diretas para garantir ingestao continua.
    """
    all_exams: list[ScrapedExamMeta] = list(SEED_EXAMS)
    seen_urls: set[str] = {e.url for e in SEED_EXAMS}

    try:
        logger.info(f"[fcc_scraper] Buscando portal oficial da FCC: {FCC_MAIN_URL}")
        resp = requests.get(FCC_MAIN_URL, headers=HEADERS, timeout=30)
        resp.raise_for_status()

        contests = _extract_contest_links_from_portal(resp.text)
        logger.info(f"[fcc_scraper] Encontrados {len(contests)} concursos no portal FCC.")

        for contest_name, contest_url in contests[:max_pages]:
            try:
                time.sleep(RATE_LIMIT_SECONDS)
                c_resp = requests.get(contest_url, headers=HEADERS, timeout=30)
                if c_resp.status_code != 200:
                    continue

                pdf_metas = _extract_pdfs_from_contest_page(contest_name, contest_url, c_resp.text)
                for meta in pdf_metas:
                    if meta.url not in seen_urls:
                        seen_urls.add(meta.url)
                        all_exams.append(meta)

            except Exception as e:
                logger.warning(f"[fcc_scraper] Erro ao raspar concurso {contest_url}: {e}")
                continue

    except Exception as e:
        logger.error(f"[fcc_scraper] Erro ao acessar portal principal da FCC: {e}")

    logger.info(f"[fcc_scraper] Total de provas/editais FCC encontrados: {len(all_exams)}")
    return all_exams


def download_exam_pdf(exam_url: str, dest_dir: str | None = None) -> str | None:
    """
    Baixa diretamente um PDF do portal da FCC (concursosfcc.com.br).
    Retorna o path local do arquivo ou None em caso de erro.
    """
    if dest_dir is None:
        dest_dir = os.path.join(tempfile.gettempdir(), "scraped_exams")
    os.makedirs(dest_dir, exist_ok=True)

    slug = exam_url.rstrip("/").split("/")[-1]
    slug = re.sub(r"[^a-zA-Z0-9_-]", "_", slug)[:100]
    filename = slug if slug.lower().endswith(".pdf") else f"{slug}.pdf"
    filepath = os.path.join(dest_dir, filename)

    if os.path.exists(filepath):
        logger.info(f"[fcc_scraper] PDF local ja existe: {filepath}")
        return filepath

    try:
        logger.info(f"[fcc_scraper] Baixando PDF oficial: {exam_url}")
        resp = requests.get(exam_url, headers=HEADERS, timeout=60, stream=True)
        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "")
        if "pdf" not in content_type.lower() and "octet-stream" not in content_type.lower():
            logger.warning(f"[fcc_scraper] URL nao retornou PDF valid: Content-Type={content_type}")
            return None

        with open(filepath, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size = os.path.getsize(filepath)
        if file_size < 3000:
            logger.warning(f"[fcc_scraper] PDF muito pequeno ({file_size}b), arquivo invalido.")
            if os.path.exists(filepath):
                os.remove(filepath)
            return None

        logger.info(f"[fcc_scraper] Download OK: {filepath} ({file_size} bytes)")
        return filepath

    except Exception as e:
        logger.error(f"[fcc_scraper] Erro no download de {exam_url}: {e}")
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass
        return None
