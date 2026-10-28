"""
Render the site's generated files from the site itself, in a real browser:

  og-image.png          the link preview card (1200×630), from tools/og.html
  favicon-32.png        PNG fallbacks of favicon.svg
  apple-touch-icon.png
  oscar-cv.pdf          the CV, printed from index.html (English)
  oscar-cv-no.pdf       the same, in Norwegian

Run it after changing anything on the homepage, so the CV never drifts:

  pip install playwright && playwright install chromium
  python tools/build-assets.py
"""

from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()

        # The link preview card.
        page = browser.new_page(viewport={"width": 1200, "height": 630})
        page.goto((ROOT / "tools" / "og.html").as_uri(), wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        page.screenshot(path=str(ROOT / "og-image.png"))
        page.close()

        # Favicons as PNG, for the browsers that ignore SVG.
        for size, name in ((32, "favicon-32.png"), (180, "apple-touch-icon.png")):
            page = browser.new_page(viewport={"width": size, "height": size})
            svg = (ROOT / "favicon.svg").read_text()
            page.set_content(f'<html><body style="margin:0">{svg.replace("<svg ", f"<svg width=\'{size}\' height=\'{size}\' ", 1)}</body></html>')
            page.screenshot(path=str(ROOT / name), omit_background=True)
            page.close()

        # The CV: the homepage, printed. The print stylesheet does the work.
        for lang, name in (("en", "oscar-cv.pdf"), ("no", "oscar-cv-no.pdf")):
            page = browser.new_page()
            page.emulate_media(reduced_motion="reduce")
            page.goto((ROOT / "index.html").as_uri() + f"?lang={lang}", wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.pdf(path=str(ROOT / name), format="A4", prefer_css_page_size=True, print_background=False)
            page.close()

        browser.close()

    for name in ("og-image.png", "favicon-32.png", "apple-touch-icon.png", "oscar-cv.pdf", "oscar-cv-no.pdf"):
        print(f"{name:22s} {(ROOT / name).stat().st_size / 1024:7.1f} KB")


if __name__ == "__main__":
    main()
