"""Shared pieces for oscarns.com pages. Authoring aid only — the output is
plain static HTML committed to the repo; the site itself has no build step."""

import re
from pathlib import Path

# Bumped on every release, so returning visitors never run a stale script.
VERSION = "2026-10-28.5"

ICONS = Path(__file__).resolve().parent / "icons"   # Tabler Icons 3.50.0, MIT


def icon(name):
    t = (ICONS / f"{name}.svg").read_text()
    t = re.sub(r"<!--.*?-->", "", t, flags=re.S)
    t = re.sub(r"<svg\b[^>]*>",
               lambda m: re.sub(r'\s(width|height|stroke-width|class)="[^"]*"', "", m.group(0)),
               t, count=1)
    t = t.replace("<svg", '<svg class="tabler" aria-hidden="true" focusable="false"', 1)
    t = re.sub(r'\s*<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*/>', "", t)
    return re.sub(r"\s+", " ", t).replace("> <", "><").strip()


def ico(name):
    return f'<span class="ico">{icon(name)}</span>'


def t(en, no, tag="span", cls=""):
    """The same thing said twice: once in English, once in Norwegian.
    CSS shows only the language the visitor picked; without CSS, both."""
    c = f' class="{cls}"' if cls else ""
    return f'<{tag}{c} lang="en">{en}</{tag}><{tag}{c} lang="nb">{no}</{tag}>'


def head(title, description, path, root, og_title=None, og_desc=None):
    url = "https://oscarns.com" + path
    return f'''<!DOCTYPE html>
<html lang="en" data-theme="dark" data-lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content="{description}" />
  <meta name="author" content="Oscar Skjævestad" />
  <meta name="robots" content="index, follow" />

  <!-- Open Graph / link previews -->
  <meta property="og:title" content="{og_title or title}" />
  <meta property="og:description" content="{og_desc or description}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://oscarns.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Oscar Skjævestad — IT &amp; Robot Deployment Lead at Wybe Robotics" />
  <meta name="twitter:card" content="summary_large_image" />

  <link rel="canonical" href="{url}" />
  <link rel="icon" href="{root}favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="{root}favicon-32.png" sizes="32x32" type="image/png" />
  <link rel="apple-touch-icon" href="{root}apple-touch-icon.png" />
  <link rel="alternate" type="application/atom+xml" title="Oscar Skjævestad — Log" href="https://oscarns.com/feed.xml" />
  <meta name="theme-color" content="#141210" />

  <!-- Before the first paint: mark that scripts run, and apply the saved
       theme and language, so nothing flashes in the wrong one. -->
  <script>
    (function () {{
      var root = document.documentElement;
      root.classList.add('js');
      var store = {{}};
      try {{ store.theme = localStorage.getItem('theme'); store.lang = localStorage.getItem('lang'); }} catch (e) {{}}
      if (store.theme === 'light') root.setAttribute('data-theme', 'light');
      var asked = new URLSearchParams(location.search).get('lang');
      var nav = (navigator.language || '').toLowerCase();
      var lang = asked || store.lang || (/^(nb|nn|no)\\b/.test(nav) ? 'no' : 'en');
      if (lang === 'no') {{ root.setAttribute('data-lang', 'no'); root.setAttribute('lang', 'nb'); }}
    }})();
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{root}style.css?v={VERSION}" />
</head>
<body>
<!-- Icons: Tabler Icons (MIT), https://tabler.io/icons -->
'''


def nav(root, home=False):
    h = "" if home else f"{root}"
    return f'''
{t('<a class="skip-link" href="#main">Skip to content</a>', '<a class="skip-link" href="#main">Hopp til innhold</a>', tag="span")}

<header class="nav" id="nav">
  <span class="progress" id="progress" aria-hidden="true"></span>
  <div class="wrap nav-inner">
    <a class="nav-name" href="{h}#top">Oscar Skjævestad</a>
    <nav class="nav-links" aria-label="Sections">
      <a href="{h}#work">{t("Work", "Arbeid")}</a>
      <a href="{h}#builds">{t("Builds", "Prosjekter")}</a>
      <a href="{h}#log">{t("Log", "Logg")}</a>
      <a href="{h}#skills">{t("Skills", "Ferdigheter")}</a>
      <a href="{h}#contact">{t("Contact", "Kontakt")}</a>
      <span class="nav-tools">
        <button class="nav-tool theme-switch" id="theme-switch" type="button">light</button>
        <button class="nav-tool" id="lang-switch" type="button">no</button>
        <button class="nav-tool palette-open" id="palette-open" type="button" aria-haspopup="dialog">{ico("command")}<span class="kbd-hint">K</span></button>
      </span>
    </nav>
  </div>
</header>
'''


def footer(root, scripts=()):
    """scripts: extra files this page needs, after the shared one."""
    extra = "".join(f'\n<script src="{root}{s}?v={VERSION}"></script>' for s in scripts)
    return f'''
<footer class="footer">
  <div class="wrap footer-inner">
    <p class="mono">© <span id="year">2026</span> Oscar Skjævestad · oscarns.com</p>
    <p class="mono footer-links">
      <a href="mailto:Oscarskjaevestad@gmail.com">{ico("mail")}{t("Email", "E-post")}</a>
      <a href="https://linkedin.com/in/oscar-skjaevestad" target="_blank" rel="noopener">{ico("brand-linkedin")}LinkedIn</a>
      <a href="{root}feed.xml">{ico("rss")}RSS</a>
    </p>
  </div>
</footer>

<script src="{root}site.js?v={VERSION}"></script>{extra}
</body>
</html>
'''
