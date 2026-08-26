"""fetch-page.py — lee CUALQUIER página web (incluidas las JS con tablas) y extrae sus tablas.

Uso:
    python fetch-page.py <URL>

Requiere el Python del entorno de OWU (donde está playwright + chromium):
    "C:\\Users\\Lightning\\AppData\\Roaming\\uv\\tools\\open-webui\\Scripts\\python.exe" scripts\\fetch-page.py <URL>
"""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

URL = os.environ.get("PAGE_URL") or (sys.argv[1] if len(sys.argv) > 1 else None)
if not URL:
    print("Uso: python fetch-page.py <URL>")
    sys.exit(1)

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    )
    try:
        page.goto(URL, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        rows = page.query_selector_all("table tbody tr")
        print(f"TOTAL FILAS: {len(rows)}\n")
        for r in rows[:30]:
            cells = r.query_selector_all("td")
            txt = [(c.inner_text() or "").strip().replace("\n", " ") for c in cells]
            print(" | ".join(t for t in txt[:12] if t)[:200])
        if not rows:
            print("SIN TABLA. Contenido:", page.inner_text("body")[:500].replace("\n", " "))
    except Exception as e:
        print("ERROR:", type(e).__name__, str(e)[:200])
    finally:
        browser.close()
