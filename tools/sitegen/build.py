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
from page_articles import ZERO, LEVEL, LADDER, JARVIS, INMOOV, FOLLOW, lost

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
    "log/follow.html": FOLLOW,
}
for path, html in pages.items():
    (out / path).write_text(html)
    print(f"{path:32s} {len(html)/1024:6.1f} KB")

# ── Atom feed for the log ────────────────────────────────────────────────
# English only: feed readers show one language. Newest first; the date is
# when the entry went up.
from xml.sax.saxutils import escape

LOG = [
    ("log/permission-ladder.html", "A voice assistant that can’t do more than it’s allowed to",
     "How J.A.R.V.I.S. decides what it may touch, why every button goes through the same gate as a spoken request, and the test that once stopped a real printer.",
     "2026-10-28"),
    ("log/zero-support-roofs.html", "Zero support roofs: why a nine-hour print failed",
     "A downloaded print file had 674 support sections and not one roof for the model to land on. Two quick checks would have caught it.",
     "2026-09-27"),
    ("log/levelling-the-bed.html", "Levelling a 420 mm bed by measurement",
     "From 2.965 mm out of true to 0.597 mm, one screw and one probe at a time — and the whole bed usable again.",
     "2026-09-27"),
]
entries = "".join(f'''
  <entry>
    <title>{escape(title)}</title>
    <link href="https://oscarns.com/{path}" />
    <id>https://oscarns.com/{path}</id>
    <published>{day}T12:00:00Z</published>
    <updated>{day}T12:00:00Z</updated>
    <summary>{escape(summary)}</summary>
  </entry>''' for path, title, summary, day in LOG)
(out / "feed.xml").write_text(f'''<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Oscar Skjævestad — Log</title>
  <subtitle>Notes from the bench: what broke, what I measured, and what I changed.</subtitle>
  <link href="https://oscarns.com/feed.xml" rel="self" />
  <link href="https://oscarns.com/#log" />
  <id>https://oscarns.com/feed.xml</id>
  <updated>{max(d for *_, d in LOG)}T12:00:00Z</updated>
  <author><name>Oscar Skjævestad</name></author>{entries}
</feed>
''')
print(f"{'feed.xml':32s} {len(LOG)} entries")

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
