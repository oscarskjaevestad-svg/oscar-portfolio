"""
Write every page of oscarns.com into the repo root.

The pages are plain static HTML and are committed as such — the site has no
build step. This is only how they are authored: edit the content in
page_index.py / page_articles.py, then run

    python tools/sitegen/build.py

and, if the homepage changed, python tools/build-assets.py to re-print the CV.
"""
import sys
from pathlib import Path
from page_index import build as index
from page_articles import ZERO, LEVEL, LADDER, JARVIS, INMOOV, lost

out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
(out / "log").mkdir(exist_ok=True)
(out / "builds").mkdir(exist_ok=True)
pages = {
    "index.html": index(),
    "404.html": lost(),
    "log/zero-support-roofs.html": ZERO,
    "log/levelling-the-bed.html": LEVEL,
    "log/permission-ladder.html": LADDER,
    "builds/jarvis.html": JARVIS,
    "builds/inmoov.html": INMOOV,
}
for path, html in pages.items():
    (out / path).write_text(html)
    print(f"{path:32s} {len(html)/1024:6.1f} KB")
