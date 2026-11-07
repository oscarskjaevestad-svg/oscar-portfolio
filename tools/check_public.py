#!/usr/bin/env python3
"""
Check the site before it goes public. Used by the log-entry skill
(.claude/skills/log-entry); run it after tools/sitegen/build.py.

    python tools/check_public.py

Three things, all standard library:

1. Nothing private in what Vercel serves: no private, CGNAT or tailnet
   addresses, no local or tailnet host names, no secrets-looking strings.
2. Photos in log/img are 1600 × 1067 JPEGs with no metadata at all
   (EXIF, GPS, XMP, ICC, comments).
3. Every log page is listed everywhere it should be: the homepage log,
   the feed, the follow page and the sitemap.

Exits 1 on any problem.
"""

import re
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# What Vercel serves: everything except what .vercelignore leaves out.
SERVED = (".html", ".xml", ".json", ".js", ".css", ".txt", ".svg")

PRIVATE = [
    (re.compile(r"\b(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"), "private IP address"),
    (re.compile(r"\b192\.168\.\d{1,3}\.\d{1,3}\b"), "private IP address"),
    (re.compile(r"\b172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b"), "private IP address"),
    (re.compile(r"\b100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b"), "tailnet (CGNAT) address"),
    (re.compile(r"[a-z0-9-]+\.ts\.net\b", re.I), "tailnet host name"),
    (re.compile(r"\b[a-z0-9-]+\.(?:local|lan|home\.arpa)\b", re.I), "local host name"),
    (re.compile(r"\b(?:ghp|github_pat|sk|xox[bp])[-_][A-Za-z0-9_]{16,}"), "token-looking string"),
    (re.compile(r"ntfy\.sh/[A-Za-z0-9_-]+"), "ntfy topic"),
]


def ignored():
    path = ROOT / ".vercelignore"
    if not path.exists():
        return []
    return [line.strip().rstrip("/") for line in path.read_text().splitlines()
            if line.strip() and not line.startswith("#")]


def served_files():
    skip = ignored()
    for path in ROOT.rglob("*"):
        rel = path.relative_to(ROOT).as_posix()
        if path.is_file() and path.suffix in SERVED and not rel.startswith(".git") \
                and not any(rel == s or rel.startswith(s + "/") for s in skip):
            yield path, rel


def check_private():
    problems = []
    for path, rel in served_files():
        text = path.read_text(errors="replace")
        for pattern, what in PRIVATE:
            for match in pattern.finditer(text):
                line = text.count("\n", 0, match.start()) + 1
                problems.append(f"{rel}:{line}: {what}: {match.group(0)}")
    return problems


def jpeg_segments(data):
    """(marker, payload) for each segment before the image data."""
    if data[:2] != b"\xff\xd8":
        raise ValueError("not a JPEG")
    at = 2
    while at + 4 <= len(data):
        if data[at] != 0xFF:
            raise ValueError("broken JPEG")
        marker = data[at + 1]
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            at += 2
            continue
        length = struct.unpack(">H", data[at + 2:at + 4])[0]
        payload = data[at + 4:at + 2 + length]
        yield marker, payload
        if marker == 0xDA:      # start of scan: the rest is pixels
            return
        at += 2 + length


def check_photo(path):
    data = path.read_bytes()
    problems = []
    size = None
    for marker, payload in jpeg_segments(data):
        if marker == 0xE0 and payload.startswith(b"JFIF"):
            continue
        if 0xE0 <= marker <= 0xEF:
            kind = payload[:12].split(b"\x00")[0].decode("latin-1", "replace") or "APP"
            problems.append(f"metadata segment APP{marker - 0xE0} ({kind})")
        elif marker == 0xFE:
            problems.append("comment segment")
        elif marker in (0xC0, 0xC1, 0xC2):
            height, width = struct.unpack(">HH", payload[1:5])
            size = (width, height)
    if size != (1600, 1067):
        problems.append(f"size {size}, expected (1600, 1067)")
    return problems


def check_photos():
    problems = []
    for path in sorted((ROOT / "log" / "img").glob("*")):
        if path.suffix.lower() not in (".jpg", ".jpeg"):
            problems.append(f"log/img/{path.name}: not a JPEG")
            continue
        try:
            problems += [f"log/img/{path.name}: {p}" for p in check_photo(path)]
        except ValueError as error:
            problems.append(f"log/img/{path.name}: {error}")
    return problems


def check_listed():
    problems = []
    pages = sorted(p.name for p in (ROOT / "log").glob("*.html") if p.name != "follow.html")
    places = {
        "homepage log (index.html)": (ROOT / "index.html").read_text(),
        "feed (feed.xml)": (ROOT / "feed.xml").read_text(),
        "follow page (log/follow.html)": (ROOT / "log" / "follow.html").read_text(),
        "sitemap (sitemap.xml)": (ROOT / "sitemap.xml").read_text(),
    }
    for name in pages:
        for place, text in places.items():
            if name not in text:
                problems.append(f"log/{name} is missing from the {place}")
    return problems


def main():
    sections = [("Private details", check_private()),
                ("Photos", check_photos()),
                ("Log listings", check_listed())]
    bad = False
    for title, problems in sections:
        print(f"{title}: {'ok' if not problems else f'{len(problems)} problem(s)'}")
        for problem in problems:
            print(f"  {problem}")
        bad = bad or bool(problems)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
