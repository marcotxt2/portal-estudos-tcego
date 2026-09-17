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


def _extract_pdf_url_from_page(html: str, page_url: str) -> str | None:
    """Extrai o link direto do PDF a partir do HTML da pagina do PCI Concursos."""
    soup = BeautifulSoup(html, "html.parser")

    # 1. Procurar por links <a href="..."> contendo .pdf ou cdn.pciconcursos.com.br
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if ".pdf" in href.lower() or "cdn.pciconcursos" in href.lower():
            if href.startswith("//"):
                return "https:" + href
            if not href.startswith("http"):
                return BASE_URL + (href if href.startswith("/") else f"/{href}")
            return href

    # 2. Procurar por iframe com src .pdf ou cdn.pciconcursos
    for iframe in soup.find_all("iframe", src=True):
        src = iframe["src"].strip()
        if ".pdf" in src.lower() or "cdn.pciconcursos" in src.lower():
            if src.startswith("//"):
                return "https:" + src
            if not src.startswith("http"):
                return BASE_URL + (src if src.startswith("/") else f"/{src}")
            return src

    # 3. Procurar elementos com data-url ou onclick com link do PDF
    for el in soup.find_all(True):
        for attr in ["data-url", "data-href", "onclick"]:
            val = el.get(attr, "")
            if val and (".pdf" in val.lower() or "cdn.pciconcursos" in val.lower()):
                match = re.search(r"https?://[^\s'\"<>]+\.pdf", val, re.IGNORECASE)
                if match:
                    return match.group(0)

    return None


def download_exam_pdf(exam_url: str, dest_dir: str | None = None) -> str | None:
    """
    Baixa o PDF de uma prova do PCI Concursos.
    Se a URL for uma pagina HTML intermediaria, extrai o link direto do PDF.
    Retorna o path local do arquivo ou None em caso de erro.
    """
    if dest_dir is None:
        dest_dir = os.path.join(tempfile.gettempdir(), "scraped_exams")
    os.makedirs(dest_dir, exist_ok=True)

    target_url = exam_url

    try:
        logger.info(f"[fcc_scraper] Acessando URL da prova: {target_url}")
        resp = requests.get(target_url, headers=HEADERS, timeout=30)
        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "")

        # Se retornou pagina HTML intermediaria, resolver o link direto do PDF
        if "html" in content_type.lower():
            direct_pdf_url = _extract_pdf_url_from_page(resp.text, target_url)
            if direct_pdf_url:
                logger.info(f"[fcc_scraper] Link direto para PDF encontrado: {direct_pdf_url}")
                target_url = direct_pdf_url
                resp = requests.get(target_url, headers=HEADERS, timeout=60, stream=True)
                resp.raise_for_status()
            else:
                logger.warning(f"[fcc_scraper] Pagina HTML nao contem link de PDF valido: {target_url}")
                return None

        # Gerar nome do arquivo
        slug = target_url.rstrip("/").split("/")[-1]
        slug = re.sub(r"[^a-zA-Z0-9_-]", "_", slug)[:100]
        filename = f"{slug}.pdf" if not slug.lower().endswith(".pdf") else slug
        filepath = os.path.join(dest_dir, filename)

        with open(filepath, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size = os.path.getsize(filepath)
        if file_size < 3000:
            logger.warning(f"[fcc_scraper] Arquivo muito pequeno ({file_size}b), nao e PDF de prova valido.")
            if os.path.exists(filepath):
                os.remove(filepath)
            return None

        logger.info(f"[fcc_scraper] Download OK: {filepath} ({file_size} bytes)")
        time.sleep(RATE_LIMIT_SECONDS)
        return filepath

    except requests.RequestException as e:
        logger.error(f"[fcc_scraper] Erro no download de {exam_url}: {e}")
        return None
