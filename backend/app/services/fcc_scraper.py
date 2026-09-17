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

HISTORICAL_CONCURSOS: list[tuple[str, str]] = [
    ("TCE GO 2025", "https://www.concursosfcc.com.br/concursos/tcego125/index.html"),
    ("TCE AM 2021", "https://www.concursosfcc.com.br/concursos/tceam121/index.html"),
    ("TCE PR 2023", "https://www.concursosfcc.com.br/concursos/tcepr123/index.html"),
    ("TCE SP 2023", "https://www.concursosfcc.com.br/concursos/tcesp123/index.html"),
    ("TCE MG 2023", "https://www.concursosfcc.com.br/concursos/tcemg123/index.html"),
    ("SEFAZ SC 2026", "https://www.concursosfcc.com.br/concursos/sefsc126/index.html"),
    ("SEFAZ SP 2023", "https://www.concursosfcc.com.br/concursos/sefazsp123/index.html"),
    ("SEFAZ PE 2022", "https://www.concursosfcc.com.br/concursos/sefazpe122/index.html"),
    ("SEFAZ AM 2022", "https://www.concursosfcc.com.br/concursos/sefazam122/index.html"),
    ("SEFAZ BA 2022", "https://www.concursosfcc.com.br/concursos/sefazba122/index.html"),
    ("TRT 1R 2024", "https://www.concursosfcc.com.br/concursos/trt1r124/index.html"),
    ("TRT 2R 2024", "https://www.concursosfcc.com.br/concursos/trt2r124/index.html"),
    ("TRT 3R 2023", "https://www.concursosfcc.com.br/concursos/trt3r123/index.html"),
    ("TRT 4R 2024", "https://www.concursosfcc.com.br/concursos/trt4r124/index.html"),
    ("TRT 5R 2023", "https://www.concursosfcc.com.br/concursos/trt5r123/index.html"),
    ("TRT 6R 2024", "https://www.concursosfcc.com.br/concursos/trt6r124/index.html"),
    ("TRT 7R 2024", "https://www.concursosfcc.com.br/concursos/trt7r124/index.html"),
    ("TRT 8R 2023", "https://www.concursosfcc.com.br/concursos/trt8r123/index.html"),
    ("TRT 9R 2023", "https://www.concursosfcc.com.br/concursos/trt9r123/index.html"),
    ("TRT 10R 2024", "https://www.concursosfcc.com.br/concursos/trt10r124/index.html"),
    ("TRT 11R 2023", "https://www.concursosfcc.com.br/concursos/trt11r123/index.html"),
    ("TRT 12R 2023", "https://www.concursosfcc.com.br/concursos/trt12r123/index.html"),
    ("TRT 14R 2024", "https://www.concursosfcc.com.br/concursos/trt14r124/index.html"),
    ("TRT 15R 2023", "https://www.concursosfcc.com.br/concursos/trt15123/index.html"),
    ("TRT 18R 2023", "https://www.concursosfcc.com.br/concursos/trt18123/index.html"),
    ("TRT 20R 2024", "https://www.concursosfcc.com.br/concursos/trt20124/index.html"),
    ("ALE RR 2025", "https://www.concursosfcc.com.br/concursos/alerr125/index.html"),
    ("MPE AL 2025", "https://www.concursosfcc.com.br/concursos/mpeal125/index.html"),
    ("MPE AM 2021", "https://www.concursosfcc.com.br/concursos/mpeam131/index.html"),
    ("MPE PB 2023", "https://www.concursosfcc.com.br/concursos/mpepb123/index.html"),
    ("MPE SE 2023", "https://www.concursosfcc.com.br/concursos/mpese123/index.html"),
    ("TJ CE 2022", "https://www.concursosfcc.com.br/concursos/tjce122/index.html"),
    ("TJ BA 2023", "https://www.concursosfcc.com.br/concursos/tjba123/index.html"),
    ("TJ MS 2024", "https://www.concursosfcc.com.br/concursos/tjms124/index.html"),
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


def discover_exam_urls(max_pages: int = 15) -> list[ScrapedExamMeta]:
    """
    Descobre provas e editais da FCC navegando no portal oficial concursosfcc.com.br
    e verificando a lista estendida de concursos historicos.
    """
    all_exams: list[ScrapedExamMeta] = list(SEED_EXAMS)
    seen_urls: set[str] = {e.url for e in SEED_EXAMS}

    # 1. Concursos do portal principal
    contests_to_scan: list[tuple[str, str]] = []
    try:
        logger.info(f"[fcc_scraper] Buscando portal oficial da FCC: {FCC_MAIN_URL}")
        resp = requests.get(FCC_MAIN_URL, headers=HEADERS, timeout=30)
        if resp.status_code == 200:
            portal_contests = _extract_contest_links_from_portal(resp.text)
            contests_to_scan.extend(portal_contests)
            logger.info(f"[fcc_scraper] Encontrados {len(portal_contests)} concursos no portal principal FCC.")
    except Exception as e:
        logger.error(f"[fcc_scraper] Erro ao acessar portal principal da FCC: {e}")

    # 2. Adicionar concursos historicos para ter um pool gigante de provas
    existing_urls = {c[1] for c in contests_to_scan}
    for h_name, h_url in HISTORICAL_CONCURSOS:
        if h_url not in existing_urls:
            contests_to_scan.append((h_name, h_url))

    # 3. Varrer cada pagina de concurso ate max_pages
    for contest_name, contest_url in contests_to_scan[:max_pages]:
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
