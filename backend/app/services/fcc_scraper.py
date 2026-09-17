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


# Fontes de sementes diretas e verificadas da FCC para alimentacao imediata e continua
SEED_EXAMS: list[ScrapedExamMeta] = [
    ScrapedExamMeta(
        url="https://www.concursosfcc.com.br/concursos/alerr125/edital_todos_os_cargos__01_04_26_fcc_sem_senha.pdf",
        cargo="Analista de Sistemas - Assembleia Legislativa de Roraima",
        ano=2025,
        orgao="ALE-RR",
    ),
    ScrapedExamMeta(
        url="https://www.concursosfcc.com.br/concursos/mpeal125/edital_01-2025_-_22_01_26__2_publicar.pdf",
        cargo="Analista de TI - Ministerio Publico de Alagoas",
        ano=2025,
        orgao="MPE-AL",
    ),
    ScrapedExamMeta(
        url="https://www.concursosfcc.com.br/concursos/tcego125/edital_de_abertura_versaex771_o_15_09_2026_-_consolidado_com_retificacoes__1_.pdf",
        cargo="Analista de Controle Externo - TI - TCE GO",
        ano=2025,
        orgao="TCE-GO",
    ),
    ScrapedExamMeta(
        url="https://www.concursosfcc.com.br/concursos/sefsc126/sefsc126_edital_de_abertura_final_publicar.pdf",
        cargo="Auditor de TI e Sistemas - SEFAZ SC",
        ano=2026,
        orgao="SEFAZ-SC",
    ),
]


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
    """Extrai links de arquivos PDF de uma pagina de concurso especifico da FCC."""
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
            # Filtrar apenas documentos relevantes ao edital de TI/Analista ou editais completos
            candidate_text = f"{contest_name} {text} {pdf_url}"
            if matches_cargo_keyword(candidate_text) or "edital" in candidate_text.lower() or "prova" in candidate_text.lower():
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
