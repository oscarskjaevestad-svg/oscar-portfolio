/* oscarns.com — the one script every page shares.
   Each part checks that its elements exist before it runs, so a page
   only gets the behaviour its markup asks for. */

(() => {
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  // The site root, relative to this page: "" on the homepage, "../" below it.
  const here = document.currentScript ? document.currentScript.getAttribute('src') : 'site.js';
  const base = here.replace(/site\.js(\?.*)?$/, '');

  const save = (key, value) => { try { localStorage.setItem(key, value); } catch (e) { /* not remembered */ } };
  const lang = () => (root.getAttribute('data-lang') === 'no' ? 'no' : 'en');

  // The text of an element in the language being shown, for anything
  // that copies text out of the page (the skill explorer, the palette).
  const visibleText = el => {
    if (!el) return '';
    // Copy it, drop the other language's half, and read what's left — so a
    // line that mixes plain text with a translated part keeps both.
    const copy = el.cloneNode(true);
    const other = lang() === 'no' ? 'en' : 'nb';
    copy.querySelectorAll('[lang="' + other + '"]').forEach(n => n.remove());
    return copy.textContent.replace(/\s+/g, ' ').trim();
  };

  if ($('year')) $('year').textContent = new Date().getFullYear();

  /* ── Theme: dark by default, light on request, remembered ── */

  const themeSwitch = $('theme-switch');
  const themeWords = { en: { light: 'light', dark: 'dark' }, no: { light: 'lys', dark: 'mørk' } };
  const labelTheme = () => {
    if (!themeSwitch) return;
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    themeSwitch.textContent = themeWords[lang()][next];
    themeSwitch.setAttribute('aria-label', lang() === 'no'
      ? 'Bytt til ' + (next === 'light' ? 'lys' : 'mørk') + ' modus'
      : 'Switch to ' + next + ' mode');
  };
  const flipTheme = () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    save('theme', next);
    labelTheme();
  };
  const toggleTheme = () => {
    if (document.startViewTransition && !calm) document.startViewTransition(flipTheme);
    else flipTheme();
  };
  if (themeSwitch) themeSwitch.addEventListener('click', toggleTheme);

  /* ── Language: English or Norwegian, remembered ── */

  const langSwitch = $('lang-switch');
  const labelLang = () => {
    if (!langSwitch) return;
    const no = lang() === 'no';
    langSwitch.textContent = no ? 'en' : 'no';
    // No lang attribute here: the stylesheet hides whatever is marked as
    // the other language, and this button is always the other language.
    langSwitch.setAttribute('aria-label', no ? 'Switch to English' : 'Bytt til norsk');
  };
  const setLang = next => {
    if (next === 'no') { root.setAttribute('data-lang', 'no'); root.setAttribute('lang', 'nb'); }
    else { root.setAttribute('data-lang', 'en'); root.setAttribute('lang', 'en'); }
    save('lang', next);
    labelLang();
    labelTheme();
    if (typeof refreshSkill === 'function') refreshSkill();
    document.dispatchEvent(new CustomEvent('langchange'));
  };
  const toggleLang = () => setLang(lang() === 'no' ? 'en' : 'no');
  if (langSwitch) langSwitch.addEventListener('click', toggleLang);
  labelLang();
  labelTheme();

  /* ── The status board's clock: the time where I am ── */

  const mossTime = $('moss-time');
  if (mossTime) {
    const tick = () => {
      mossTime.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit'
      }).format(new Date());
    };
    tick();
    setInterval(tick, 15000);
  }

  /* ── The status board, kept current from status.json ──
     The markup already holds the last known state, so nothing changes
     if the file is missing; when it is there, it wins. */

  const STAGES = ['electronics', 'print', 'assemble', 'code'];
  const applyStatus = status => {
    const board = $('inmoov-stages');
    const stage = status && status.inmoov && status.inmoov.stage;
    if (board && (STAGES.includes(stage) || stage === 'done')) {
      const at = stage === 'done' ? STAGES.length : STAGES.indexOf(stage);
      board.querySelectorAll('.stage').forEach((el, i) => {
        el.classList.toggle('done', i < at);
        el.classList.toggle('next', i === at);
        const sr = el.querySelector('.sr-only');
        if (sr) {
          sr.innerHTML = i < at
            ? '<span lang="en"> (done)</span><span lang="nb"> (ferdig)</span>'
            : i === at ? '<span lang="en"> (next)</span><span lang="nb"> (neste)</span>' : '';
        }
      });
    }
    const jarvis = $('jarvis-status');
    if (jarvis && status && status.jarvis) {
      const live = status.jarvis.state === 'live';
      const tests = status.jarvis.tests ? Math.floor(status.jarvis.tests / 100) * 100 + '+' : '500+';
      jarvis.innerHTML = live
        ? '<span lang="en">Live · local voice assistant · ' + tests + ' tests</span><span lang="nb">Live · lokal stemmeassistent · ' + tests + ' tester</span>'
        : '<span lang="en">Offline for now · local voice assistant</span><span lang="nb">Frakoblet akkurat nå · lokal stemmeassistent</span>';
    }
    const updated = $('now-updated');
    if (updated && status && status.updated) {
      const d = new Date(status.updated);
      if (!isNaN(d)) {
        const when = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Oslo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d).replace(/\//g, '.');
        updated.innerHTML = '<span lang="en">Updated ' + when + '</span><span lang="nb">Oppdatert ' + when + '</span>';
        updated.hidden = false;
      }
    }
  };
  if ($('inmoov-stages') || $('jarvis-status')) {
    fetch(base + 'status.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(applyStatus)
      .catch(() => { /* keep what the page already says */ });
  }

  /* ── A hairline under the nav once the page has moved ── */

  const nav = $('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Entries and sections draw in as they reach the screen ── */

  document.querySelectorAll('.entries').forEach(list => {
    [...list.children].forEach((entry, i) => entry.style.setProperty('--i', i % 6));
  });
  const watched = document.querySelectorAll('.entry, .section');
  if ('IntersectionObserver' in window && !calm) {
    const seen = new IntersectionObserver(items => {
      items.forEach(item => {
        if (item.isIntersecting) {
          item.target.classList.add('in');
          seen.unobserve(item.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    watched.forEach(el => seen.observe(el));
  } else {
    watched.forEach(el => el.classList.add('in'));
  }

  /* ── How far down the page you are, as a line under the nav ── */

  const progress = $('progress');
  if (progress) {
    let pending = false;
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
      pending = false;
    };
    window.addEventListener('scroll', () => {
      if (!pending) { pending = true; requestAnimationFrame(measure); }
    }, { passive: true });
    measure();
  }

  /* ── The nav marks the section you are reading (homepage) ── */

  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  if (navLinks.length && 'IntersectionObserver' in window) {
    const mark = id => navLinks.forEach(a => {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    const spy = new IntersectionObserver(items => {
      items.forEach(item => { if (item.isIntersecting) mark(item.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section').forEach(sec => spy.observe(sec));
  }

  /* ── Skills: pick one and what used it lights up ── */

  const skills = [...document.querySelectorAll('.skill')];
  const answer = $('skill-used');
  const lit = [...document.querySelectorAll('#work .entry, #builds .entry, #education .entry')];
  let pinned = null;
  let shown = null;

  const describe = id => {
    const entry = $(id);
    const title = visibleText(entry.querySelector('.entry-title'));
    const meta = entry.querySelector('.entry-meta');
    const where = meta ? visibleText(meta).split('·')[0].trim() : '';
    return { id, text: where && !/^(google|cisco|nsm|norsk|norwegian)/i.test(where) ? title + ', ' + where : title };
  };

  const show = button => {
    shown = button;
    const ids = button ? button.dataset.in.split(' ').filter(Boolean) : [];
    document.body.classList.toggle('exploring', !!button && ids.length > 0);
    lit.forEach(e => {
      e.classList.toggle('lit', ids.includes(e.id));
      e.classList.toggle('dim', !!button && ids.length > 0 && !ids.includes(e.id));
    });
    skills.forEach(b => b.setAttribute('aria-pressed', String(b === pinned)));
    if (!answer) return;
    answer.textContent = '';
    if (!button) return;
    const name = visibleText(button);
    if (!ids.length) {
      answer.textContent = name + (lang() === 'no'
        ? ' — generell bakgrunn, ikke knyttet til én jobb eller ett prosjekt.'
        : ' — general background, not tied to one job or build.');
      return;
    }
    answer.append(name + ' → ');
    ids.map(describe).forEach((d, i) => {
      if (i) answer.append(' · ');
      const a = document.createElement('a');
      a.href = '#' + d.id;
      a.textContent = d.text;
      answer.append(a);
    });
  };
  var refreshSkill = () => { if (shown) show(shown); };

  skills.forEach(b => {
    b.addEventListener('mouseenter', () => { if (!pinned) show(b); });
    b.addEventListener('focus', () => { if (!pinned) show(b); });
    b.addEventListener('click', () => { pinned = pinned === b ? null : b; show(pinned || b); });
  });
  if ($('skills')) {
    $('skills').addEventListener('mouseleave', () => { if (!pinned) show(null); });
  }

  /* ── ⌘K: jump anywhere ──
     Sections, every job, build and log entry, the project pages and a
     few actions, filtered as you type. Built from a fixed list plus
     whatever entries this page holds, so it works on every page. */

  const paletteButton = $('palette-open');
  const hint = paletteButton && paletteButton.querySelector('.kbd-hint');
  if (hint) hint.textContent = isMac ? 'K' : 'Ctrl K';
  if (paletteButton) paletteButton.setAttribute('aria-label', isMac ? 'Search and jump (⌘K)' : 'Search and jump (Ctrl+K)');

  const home = base || './';
  const PAGES = [
    { en: 'Work', no: 'Arbeid', kind: 'section', href: home + '#work' },
    { en: 'Builds', no: 'Prosjekter', kind: 'section', href: home + '#builds' },
    { en: 'Log', no: 'Logg', kind: 'section', href: home + '#log' },
    { en: 'Skills', no: 'Ferdigheter', kind: 'section', href: home + '#skills' },
    { en: 'Education', no: 'Utdanning', kind: 'section', href: home + '#education' },
    { en: 'Contact', no: 'Kontakt', kind: 'section', href: home + '#contact' },
    { en: 'J.A.R.V.I.S. — how it’s built', no: 'J.A.R.V.I.S. — slik er den bygget', kind: 'page', href: base + 'builds/jarvis.html' },
    { en: 'InMoov hand — the build', no: 'InMoov-hånden — byggingen', kind: 'page', href: base + 'builds/inmoov.html' },
    { en: 'A voice assistant that can’t do more than it’s allowed to', no: 'En stemmeassistent som ikke kan gjøre mer enn den har lov til', kind: 'log', href: base + 'log/permission-ladder.html' },
    { en: 'Zero support roofs: why a nine-hour print failed', no: 'Null støttetak: hvorfor en ni timers print feilet', kind: 'log', href: base + 'log/zero-support-roofs.html' },
    { en: 'Levelling a 420 mm bed by measurement', no: 'Nivellering av en 420 mm printeplate etter mål', kind: 'log', href: base + 'log/levelling-the-bed.html' },
    { en: 'Download CV', no: 'Last ned CV', kind: 'action', href: () => base + (lang() === 'no' ? 'oscar-cv-no.pdf' : 'oscar-cv.pdf') },
    { en: 'Email Oscar', no: 'Send e-post til Oscar', kind: 'action', href: 'mailto:Oscarskjaevestad@gmail.com' },
    { en: 'Switch light / dark', no: 'Bytt lys / mørk', kind: 'action', run: toggleTheme },
    { en: 'Norsk / English', no: 'Norsk / English', kind: 'action', run: toggleLang },
  ];
  const KIND = {
    section: { en: 'Section', no: 'Seksjon' }, page: { en: 'Page', no: 'Side' }, log: { en: 'Log', no: 'Logg' },
    action: { en: 'Action', no: 'Handling' }, entry: { en: 'Entry', no: 'Oppføring' }, skill: { en: 'Skill', no: 'Ferdighet' },
  };

  const items = () => {
    const onPage = [...document.querySelectorAll('#work .entry[id], #builds .entry[id]')].map(e => ({
      label: visibleText(e.querySelector('.entry-title')), kind: 'entry', href: '#' + e.id,
    }));
    const skillItems = skills.map(b => ({
      label: visibleText(b), kind: 'skill', run: () => { location.hash = 'skills'; pinned = b; show(b); b.focus(); },
    }));
    return PAGES.map(p => ({ label: p[lang()], kind: p.kind, href: p.href, run: p.run }))
      .concat(onPage, skillItems);
  };

  // Every typed letter must appear, in order; earlier and tighter matches rank higher.
  // "GR00T" is spelt with zeros; nobody types it that way from memory.
  const fold = str => str.toLowerCase().replace(/0/g, 'o');
  const score = (text, query) => {
    if (!query) return 1;
    const t = fold(text);
    query = fold(query);
    if (t.includes(query)) return 100 - t.indexOf(query);
    let at = -1, gaps = 0;
    for (const ch of query) {
      const next = t.indexOf(ch, at + 1);
      if (next < 0) return 0;
      gaps += next - at - 1;
      at = next;
    }
    return 50 - Math.min(gaps, 49);
  };

  let palette = null;
  let opener = null;

  const buildPalette = () => {
    palette = document.createElement('div');
    palette.className = 'palette';
    palette.hidden = true;
    palette.innerHTML =
      '<div class="palette-backdrop" data-close></div>' +
      '<div class="palette-box" role="dialog" aria-modal="true" aria-labelledby="palette-label">' +
      '  <label class="sr-only" id="palette-label" for="palette-input"></label>' +
      '  <input class="palette-input" id="palette-input" type="text" autocomplete="off" spellcheck="false"' +
      '         role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" />' +
      '  <ul class="palette-list" id="palette-list" role="listbox"></ul>' +
      '  <p class="palette-foot mono"></p>' +
      '</div>';
    document.body.append(palette);
    palette.addEventListener('click', e => { if (e.target.hasAttribute('data-close')) closePalette(); });
    const input = palette.querySelector('input');
    input.addEventListener('input', () => renderPalette(input.value));
    input.addEventListener('keydown', paletteKeys);
  };

  let results = [];
  let active = 0;

  const renderPalette = query => {
    const q = query.trim().toLowerCase();
    results = items()
      .map(item => ({ item, s: score(item.label, q) }))
      .filter(r => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map(r => r.item);
    active = 0;
    const list = palette.querySelector('.palette-list');
    list.innerHTML = '';
    results.forEach((item, i) => {
      const li = document.createElement('li');
      li.id = 'palette-opt-' + i;
      li.setAttribute('role', 'option');
      li.className = 'palette-item';
      li.innerHTML = '<span class="palette-label"></span><span class="palette-kind mono"></span>';
      li.querySelector('.palette-label').textContent = item.label;
      li.querySelector('.palette-kind').textContent = KIND[item.kind][lang()];
      li.addEventListener('mousemove', () => { active = i; markActive(); });
      li.addEventListener('click', () => choose(i));
      list.append(li);
    });
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'palette-empty mono';
      li.textContent = lang() === 'no' ? 'Ingen treff' : 'Nothing matches';
      list.append(li);
    }
    markActive();
  };

  const markActive = () => {
    const input = palette.querySelector('input');
    palette.querySelectorAll('.palette-item').forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    const current = $('palette-opt-' + active);
    if (current) { input.setAttribute('aria-activedescendant', current.id); current.scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  };

  const choose = i => {
    const item = results[i];
    if (!item) return;
    closePalette();
    if (item.run) { item.run(); return; }
    const href = typeof item.href === 'function' ? item.href() : item.href;
    location.href = href;
  };

  const paletteKeys = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, results.length - 1); markActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); markActive(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
    else if (e.key === 'Tab') { e.preventDefault(); }  // focus stays in the dialog
  };

  const openPalette = () => {
    if (!palette) buildPalette();
    opener = document.activeElement;
    const no = lang() === 'no';
    palette.querySelector('#palette-label').textContent = no ? 'Søk og gå til' : 'Search and jump to';
    const input = palette.querySelector('input');
    input.placeholder = no ? 'Gå til en seksjon, jobb, prosjekt eller ferdighet…' : 'Jump to a section, job, build or skill…';
    palette.querySelector('.palette-foot').textContent = no
      ? '↑↓ velg · ↵ åpne · esc lukk'
      : '↑↓ choose · ↵ open · esc close';
    input.value = '';
    palette.hidden = false;
    document.body.classList.add('palette-on');
    renderPalette('');
    input.focus();
  };

  const closePalette = () => {
    if (!palette || palette.hidden) return;
    // Focus must leave the hidden input, or the next keypress types into
    // it and "/" can never reopen the palette.
    palette.querySelector('input').blur();
    palette.hidden = true;
    document.body.classList.remove('palette-on');
    if (opener && opener !== document.body && opener.focus) opener.focus();
  };

  if (paletteButton) paletteButton.addEventListener('click', openPalette);

  document.addEventListener('keydown', e => {
    const el = document.activeElement;
    const typing = el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && el.offsetParent !== null;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette && !palette.hidden) closePalette(); else openPalette();
    } else if (e.key === '/' && !typing && (!palette || palette.hidden)) {
      e.preventDefault();
      openPalette();
    } else if (e.key === 'Escape') {
      if (palette && !palette.hidden) closePalette();
      else if (pinned) { pinned = null; show(null); }
    }
  });
})();
