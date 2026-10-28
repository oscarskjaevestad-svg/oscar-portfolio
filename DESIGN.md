# oscarns.com — design system

**Direction: an engineering notebook.** A record of real work and real builds, written down plainly. Warm ink on a dark page by default, warm paper in light mode, one orange signal colour, and type doing the work that cards, glows and icons did before.

**Audience:** robotics and AI people first. Work leads, builds follow, everything else supports.

**Not based on real reference sites.** UXKIN was not connected; these decisions come from the design rules and the brief above.

**What this replaces, deliberately:** navy-and-cyan with glow blobs and grain, `// section` labels, emoji as icons, a typewriter, pulsing dots, filler stats, pill tags, and identical rounded cards fading up on scroll. Each was a default rather than a decision.

---

## Colour

Warm neutrals only — no blue anywhere. One signal colour. Every value is a CSS variable in `style.css`; pages use the names, never raw values.

| Token | Dark (default) | Light | Role |
|---|---|---|---|
| `--bg` | `#141210` | `#f4f0e8` | Page background |
| `--surface` | `#1b1916` | `#ebe6dc` | The rare raised area: code, the CV callout |
| `--rule` | `#2e2a25` | `#d8d1c4` | Hairlines between entries, borders |
| `--text` | `#ece6dc` | `#1d1a16` | Body and headings — the "ink" |
| `--text-dim` | `#a39b8f` | `#4f4940` | Secondary text, descriptions |
| `--text-faint` | `#8a8276` | `#6f685e` | Dates, meta, labels |
| `--signal` | `#ff6a2b` | `#b23a0a` | Links, focus, live/in-progress status, the one accent |
| `--signal-ink` | `#141210` | `#f4f0e8` | Text on a signal background |
| `--success` | `#7bc47f` | `#2f7a33` | Reserved; no current use |
| `--error` | `#ef6b5b` | `#b42318` | Reserved; no current use |

Contrast against `--bg`, calculated (WCAG 2.1): `--text` 15.1:1 dark / 15.3:1 light; `--text-dim` 6.8 / 7.8; `--text-faint` 4.9 / 4.8; `--signal` 6.5 / 5.3. Button text (`--signal-ink` on `--signal`) is 6.5 / 5.3. Everything used for text meets 4.5:1. The light-mode orange was darkened from `#c2410c` (4.56:1) to keep a real margin rather than scrape past.

The orange is used sparingly on purpose. If it appears more than a handful of times on a screen, it stops signalling.

## Typography

Two families from one engineering-rooted superfamily, which keeps them coherent without matching a trend:

- **IBM Plex Sans** — headings and body. Weights 400, 500, 600.
- **IBM Plex Mono** — dates, places, specs, status, tags, the nav. Weights 400, 500.

| Token | Size | Line height | Use |
|---|---|---|---|
| `--fs-xs` | 0.8125rem (13px) | 1.45 | Mono meta: dates, status, tags |
| `--fs-sm` | 0.9375rem (15px) | 1.55 | Lists, secondary lines |
| `--fs-base` | 1.0625rem (17px) | 1.65 | Body |
| `--fs-lg` | 1.25rem (20px) | 1.5 | Lead paragraph, entry titles |
| `--fs-xl` | 1.5rem (24px) | 1.3 | Section headings |
| `--fs-2xl` | 2rem (32px) | 1.2 | Reserved for large statements |
| `--fs-hero` | clamp(2.25rem, 6vw, 3.5rem) | 1.06 | The name, once |

Body never below 16px. Reading lines capped at 68 characters. Headings are sentence case. Mono labels are uppercase with 0.08em tracking, and nothing else is.

## Spacing and layout

A 4px scale: `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-6` 24 · `--s-8` 32 · `--s-12` 48 · `--s-16` 64 · `--s-24` 96.

- **One column, left-aligned, max 760px.** A notebook is read top to bottom.
- **Entries use a gutter:** a 9rem mono column on the left for dates and status, content on the right. On phones the gutter stacks above the content.
- **Sections** are 96px apart on desktop, 64px on phones, each opened by a hairline rule.
- **Page padding** is 24px on phones, 32px from 768px up.

## Shape and depth

- Radius: `--radius` **2px**, for focus outlines and the button only. Everything else is square.
- **No shadows. No blur. No gradients.**
- Separation comes from hairline rules (`1px solid var(--rule)`) and spacing, never from boxes.

## Components

**Navigation.** Name on the left; Work, Builds, Skills, Contact and the theme switch on the right, in mono. Sticky, with the page background behind it and a hairline under it once scrolled. On phones the links drop to a second line rather than hiding behind a menu button — four short words fit.

**Links.** `--signal`, underlined with a 1px line offset 3px; the line thickens to 2px on hover. Visited links don't change colour.

**Buttons.** Used only where a link would undersell the action (the CV).
- *Primary:* `--signal` background, `--signal-ink` text, 2px radius. Hover darkens via `filter: brightness(1.1)`.
- *Secondary:* transparent, 1px `--rule` border, `--text`. Hover: border becomes `--text-dim`.
- *Quiet:* a plain link with a trailing `→`.
- *Focus (all):* 2px `--signal` outline, 2px offset. Never removed.
- *Disabled:* 40% opacity, `not-allowed` cursor. No current use.

**Entry** — the notebook's basic unit, used for jobs, builds, education and certifications. A hairline above, the gutter on the left (date range, then status), and on the right a title, a mono meta line (company · place), a short paragraph, an optional list, and tags.

**Status.** Mono xs uppercase text, no pill: `LIVE` and `IN PROGRESS` in `--signal`, `COMPLETED` in `--text-dim`, `PLANNED` in `--text-faint`, `CURRENT` in `--signal`.

**Tags.** A single mono line separated by `·`, in `--text-faint`. No chips.

**Theme switch.** A mono text button reading `light` or `dark` (the mode it switches to). Dark is the default; the choice is remembered.

**Footer.** One hairline and one line: name, year, email and LinkedIn.

## Imagery and icons

- **No icons and no emoji.** Labels are words.
- **No images yet.** When project photos arrive: 3:2, full column width, a 1px `--rule` border, square corners, and a mono xs caption below in `--text-faint`. Real photos only — no stock, no illustrations.

## Motion

None beyond a 150ms colour transition when the theme changes. No scroll reveals, no typewriter, no pulsing. `prefers-reduced-motion` turns even the transition off.
