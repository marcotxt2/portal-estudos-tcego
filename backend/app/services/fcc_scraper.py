"""
Scraper de provas FCC do PCI Concursos.

Coleta links de provas de cargos TI, baixa os PDFs e retorna paths locais.
Rate-limited (2s entre requests) para uso etico.
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

BASE_URL = "https://www.pciconcursos.com.br"
PROVAS_FCC_URL = f"{BASE_URL}/provas/fcc/"
RATE_LIMIT_SECONDS = 2.5

HEADERS = {
    "User-Agent": "PortalEstudosTCEGO/1.0 (estudo pessoal; contato via github)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.5",
}


@dataclass
class ScrapedExamMeta:
    url: str          # URL completa de download
    cargo: str        # Nome do cargo
    ano: int | None   # Ano da prova
    orgao: str        # Orgao (ex: TCE/SP, TRT/SP)


def _parse_year(text: str) -> int | None:
    text = text.strip()
    if text.isdigit() and len(text) == 4:
        return int(text)
    return None


def _extract_provas_from_page(html: str) -> list[ScrapedExamMeta]:
    """Extrai metadata de provas de uma pagina HTML do PCI Concursos."""
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", id="lista_provas")
    if not table:
        return []

    results = []
    rows = table.find_all("tr", class_="lk_link")

    for row in rows:
        url = row.get("data-url", "")
        if not url:
            continue
        if not url.startswith("http"):
            url = BASE_URL + url

        # Extrair celulas: cargo, ano, orgao, organizadora
        cells = row.find_all("td")
        if len(cells) < 3:
            continue

        # Cargo: texto do link na primeira celula
        cargo_link = cells[0].find("a")
        cargo = cargo_link.get_text(strip=True) if cargo_link else cells[0].get_text(strip=True)

        # Ano: segunda celula
        ano = _parse_year(cells[1].get_text(strip=True))

        # Orgao: terceira celula
        orgao_link = cells[2].find("a")
        orgao = orgao_link.get_text(strip=True) if orgao_link else cells[2].get_text(strip=True)

        results.append(ScrapedExamMeta(url=url, cargo=cargo, ano=ano, orgao=orgao))

    return results


def discover_exam_urls(max_pages: int = 10) -> list[ScrapedExamMeta]:
    """
    Navega pelas paginas de provas FCC no PCI Concursos.
    Filtra apenas cargos de TI relevantes ao edital.
    Retorna lista de metadata das provas encontradas.
    """
    all_exams: list[ScrapedExamMeta] = []
    seen_urls: set[str] = set()

    for page in range(1, max_pages + 1):
        url = PROVAS_FCC_URL if page == 1 else f"{PROVAS_FCC_URL}?pagina={page}"

        try:
            logger.info(f"[fcc_scraper] Buscando pagina {page}: {url}")
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
        except requests.RequestException as e:
            logger.error(f"[fcc_scraper] Erro ao acessar pagina {page}: {e}")
            break

        exams = _extract_provas_from_page(resp.text)
        if not exams:
            logger.info(f"[fcc_scraper] Pagina {page} sem provas, encerrando.")
            break

        for exam in exams:
            if exam.url in seen_urls:
                continue
            seen_urls.add(exam.url)

            # Filtrar apenas cargos de TI
            if matches_cargo_keyword(exam.cargo):
                all_exams.append(exam)

        time.sleep(RATE_LIMIT_SECONDS)

    logger.info(f"[fcc_scraper] Total de provas TI encontradas: {len(all_exams)}")
    return all_exams


def download_exam_pdf(exam_url: str, dest_dir: str | None = None) -> str | None:
    """
    Baixa o PDF de uma prova do PCI Concursos.
    Retorna o path local do arquivo ou None em caso de erro.
    """
    if dest_dir is None:
        dest_dir = os.path.join(tempfile.gettempdir(), "scraped_exams")
    os.makedirs(dest_dir, exist_ok=True)

    # Gerar nome de arquivo a partir da URL
    slug = exam_url.rstrip("/").split("/")[-1]
    slug = re.sub(r"[^a-zA-Z0-9_-]", "_", slug)[:100]
    filename = f"{slug}.pdf"
    filepath = os.path.join(dest_dir, filename)

    if os.path.exists(filepath):
        logger.info(f"[fcc_scraper] PDF ja existe: {filepath}")
        return filepath

    try:
        logger.info(f"[fcc_scraper] Baixando: {exam_url}")
        resp = requests.get(exam_url, headers=HEADERS, timeout=60, stream=True)
        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "")
        if "pdf" not in content_type.lower() and "octet-stream" not in content_type.lower():
            logger.warning(f"[fcc_scraper] Conteudo nao e PDF ({content_type}), pulando.")
            return None

        with open(filepath, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size = os.path.getsize(filepath)
        if file_size < 5000:
            logger.warning(f"[fcc_scraper] PDF muito pequeno ({file_size}b), possivelmente invalido.")
            os.remove(filepath)
            return None

        logger.info(f"[fcc_scraper] Download OK: {filepath} ({file_size} bytes)")
        time.sleep(RATE_LIMIT_SECONDS)
        return filepath

    except requests.RequestException as e:
        logger.error(f"[fcc_scraper] Erro no download de {exam_url}: {e}")
        if os.path.exists(filepath):
            os.remove(filepath)
        return None
