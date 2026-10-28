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

# ── Security headers ─────────────────────────────────────────────────────
# Written next to the pages so the Content-Security-Policy always allows
# exactly the inline scripts the pages contain, and nothing else. The only
# one is the small theme/language script in <head> that must run before
# the first paint; it is allowed by its hash, so an injected script is not.
import base64, hashlib, json, re

inline = set()
for html in pages.values():
    for body in re.findall(r"<script>(.*?)</script>", html, flags=re.S):
        inline.add("'sha256-" + base64.b64encode(hashlib.sha256(body.encode()).digest()).decode() + "'")

csp = "; ".join([
    "default-src 'self'",
    "script-src 'self' " + " ".join(sorted(inline)),
    # Inline style attributes carry a few CSS variables (--line: n).
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
])

vercel = {
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {"key": "X-Content-Type-Options", "value": "nosniff"},
                {"key": "X-Frame-Options", "value": "DENY"},
                {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
                {"key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()"},
                {"key": "Cross-Origin-Opener-Policy", "value": "same-origin"},
            ],
        },
        {
            # Pages only: a PDF viewer is a document of its own.
            "source": "/((?!.*\\.pdf$).*)",
            "headers": [{"key": "Content-Security-Policy", "value": csp}],
        },
    ]
}
(out / "vercel.json").write_text(json.dumps(vercel, indent=2) + "\n")
print(f"{'vercel.json':32s} {len(inline)} inline script hash(es)")
