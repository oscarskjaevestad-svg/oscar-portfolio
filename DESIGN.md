# oscarns.com — design system

**Direction: an engineering notebook.** A record of real work and real builds, written down plainly. Warm ink on a dark page by default, warm paper in light mode, one ink-blue signal colour — the blue of a ballpoint pen in a lab notebook — and type doing most of the work, with one consistent line-icon set beside the words.

**Audience:** robotics and AI people first. Work leads, builds follow, everything else supports.

**Not based on real reference sites.** UXKIN was not connected; these decisions come from the design rules and the brief above.

**What this replaces, deliberately:** navy-and-cyan with glow blobs and grain, `// section` labels, emoji as icons, a typewriter, pulsing dots, filler stats, pill tags, and identical rounded cards fading up on scroll. Each was a default rather than a decision.

---

## Colour

Warm neutrals, and one ink-blue signal. The backgrounds stay warm, which is what keeps the blue reading as pen ink rather than the old navy-and-cyan tech look. Every value is a CSS variable in `style.css`; pages use the names, never raw values.

**Rejected: orange.** The first version used orange (`#ff6a2b`) on near-black. Bright orange on black is Pornhub's palette, and once noticed it can't be unseen. Avoid orange-on-black pairings for the signal.

| Token | Dark (default) | Light | Role |
|---|---|---|---|
| `--bg` | `#141210` | `#f4f0e8` | Page background |
| `--bg-alt` | `#1a1815` | `#ece6da` | Every other section, so the page turns like paper |
| `--surface` | `#23201c` | `#fbf9f4` | Raised panels: the Now card and featured entries |
| `--rule` | `#2e2a25` | `#d8d1c4` | Hairlines between entries, borders |
| `--text` | `#ece6dc` | `#1d1a16` | Body and headings — the "ink" |
| `--text-dim` | `#a39b8f` | `#4f4940` | Secondary text, descriptions |
| `--text-faint` | `#968e82` | `#655e55` | Dates, meta, labels |
| `--signal` | `#8fa8ff` | `#2747b8` | Links, focus, live/in-progress status, the progress line — the one accent |
| `--signal-ink` | `#141210` | `#f4f0e8` | Text on a signal background |
| `--success` | `#7bc47f` | `#2f7a33` | Reserved; no current use |
| `--error` | `#ef6b5b` | `#b42318` | Reserved; no current use |
| `--wash` | blue at 9% | blue at 8% | The ink soaking into the top of the page; a picked skill |
| `--hover` | ink at 3.5% | ink at 3.5% | The tint under an entry being pointed at |

Contrast, calculated (WCAG 2.1) on **every** background a colour can sit on — `--bg`, `--bg-alt` and `--surface`, both themes. Worst cases: `--text` 13.1:1; `--text-dim` 5.9:1; `--text-faint` 5.0:1; `--signal` 6.3:1. Button text (`--signal-ink` on `--signal`) is 8.2 / 6.9. Everything used for text meets 4.5:1 everywhere. `--text-faint` was lifted (dark) and deepened (light) when the shaded backgrounds arrived, because the first values dropped to 4.3:1 on them.

The blue is used sparingly on purpose. If it appears more than a handful of times on a screen, it stops signalling.

## Typography

Chosen from a rendered specimen of four candidates (Bricolage Grotesque, Archivo, Schibsted Grotesk, Geist):

- **Schibsted Grotesk** — headings and body. Weights 400, 500, 600, 700. Designed in Norway for Schibsted's newspapers: clean, confident and sharp, with a quiet local tie.
- **JetBrains Mono** — dates, places, specs, status, tags, the nav. Weights 400, 500.

The first version used IBM Plex Sans and Mono; they read as too tame.

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
- **Sections** are 96px apart on desktop, 64px on phones. They alternate between `--bg` and `--bg-alt` (About plain, Work shaded, Builds plain, Skills shaded, Education plain, Contact shaded); the change of shade is the divider, so sections have no rule.
- **Entries reach past the column:** each entry extends `--entry-pad` (16px phones, 24px desktop) beyond the text on both sides, so hover tints and raised panels have room while the words stay aligned.
- **Page padding** is 24px on phones, 32px from 768px up.

## Shape and depth

- Radius: `--radius` **2px** for focus outlines, buttons and skill highlights; `--radius-panel` **6px** for raised panels and entry hover. Nothing rounder.
- **Two shadows, one for each kind of lift:**
  - `--shadow` — raised panels (the Now card, featured entries). A 1px top highlight and a long, soft, low-opacity drop. Warm brown in light mode, black in dark.
  - `--shadow-hover` — an entry being pointed at. Shorter and lighter.
- **One gradient:** the ink wash at the top of the page (`--wash`, a soft radial from the top-left). No others.
- **No blur. No glows.** The CV button's shadow is tinted with `--signal`, but it is a shadow beneath it, not a halo around it.
- Between entries, separation is still a hairline (`--rule`), aligned with the text, not the panel edge.

## Components

**Navigation.** Name on the left; Work, Builds, Skills, Contact and the theme switch on the right, in mono. Sticky; transparent over the ink wash at the top, then the page background and a hairline once scrolled. The section being read is marked with a 2px `--signal` underline (`aria-current`). On phones the links drop to a second line rather than hiding behind a menu button.

**Now panel — a live status board.** A raised `--surface` card in the intro. Its header reads `NOW` on the left and `● LIVE · MOSS hh:mm` on the right — the real time in Moss (Europe/Oslo), updated every 15 seconds. Below, up to three items, each a 40px icon tile (`--wash` fill, `--signal` icon), a bold title, and a mono status line with a link to its entry. A project with real stages shows them as a tracker — filled dot for done, pulsing `--signal` ring for next, empty ring for still to come — with the state also given in text for screen readers. **Every line must be true today**; update it when something changes.

**Links.** `--signal` with a resting 1px underline; on hover a 2px line sweeps in from the left. Visited links don't change colour.

**Buttons.** Used only where a link would undersell the action (the CV).
- *Primary:* `--signal` background, `--signal-ink` text, 2px radius. Hover darkens via `filter: brightness(1.1)`.
- *Secondary:* transparent, 1px `--rule` border, `--text`. Hover: border becomes `--text-dim`.
- *Quiet:* a plain link with a trailing `→`.
- *Focus (all):* 2px `--signal` outline, 2px offset. Never removed.
- *Disabled:* 40% opacity, `not-allowed` cursor. No current use.

**Entry** — the notebook's basic unit, used for jobs, builds, skills, education, certifications and contact rows. A hairline above, the gutter on the left (date range, then status), and on the right a title, a mono meta line (company · place), a short paragraph, an optional list, and tags.
- *Hover* (pointer devices only): `--hover` tint, `--shadow-hover`, lifted 2px; its hairlines fade so the lift reads as one object.
- *Featured:* the current job and the live build sit on `--surface` with `--shadow`. Two at most on the page — featuring more stops meaning anything.

**Timeline.** The Work entries are joined by a 1px `--rule` line in a 22px lane left of the gutter, with a 9px ring at each job. The current job's ring is filled `--signal` and pulses. The line runs from each dot to the next.

**Skill explorer.** Every skill is a button. Pointing, focusing or tapping one marks it (`--wash` behind `--signal` text), lights the jobs and builds that used it with a 1px `--signal` ring, steps the rest back to 35% opacity, and writes the answer out below the list with links — the entries are usually off-screen, so the answer must be readable on its own. A tap pins it; tapping again or Escape clears it. The mapping is written by hand in the markup (`data-in`), never inferred, so it never claims a connection that isn't true; a skill with no single source says so.

**Status.** Mono xs uppercase text, no pill: `LIVE` and `IN PROGRESS` in `--signal`, `COMPLETED` in `--text-dim`, `PLANNED` in `--text-faint`, `CURRENT` in `--signal`. `LIVE` and `CURRENT` carry a 6px dot with a slow heartbeat (see Motion).

**Links** also carry a resting 1px underline and, on hover, a 2px line that sweeps in from the left.

**Tags.** A single mono line separated by `·`, in `--text-faint`. No chips.

**Theme switch.** A mono text button reading `light` or `dark` (the mode it switches to). Dark is the default; the choice is remembered.

**Footer.** One hairline and one line: name, year, email and LinkedIn.

## Imagery and icons

- **Icons: Tabler Icons, outline, MIT** — one set only, inlined as SVG (no runtime requests), 1.75 stroke. Credited once in a comment at the top of `<body>`.
- **Always beside a word, never instead of one.** Every icon is `aria-hidden`; the word next to it carries the meaning.
- **Where they go:** section headings (in `--signal`), each build and each skill category (in `--text-faint`, turning `--signal` on hover and on featured entries), the Now board's tiles, the contact rows and the footer links.
- **Never emoji.** The first version's emoji icons were one of the clearest signs of a generated site.
- **No images yet.** When project photos arrive: 3:2, full column width, a 1px `--rule` border, `--radius-panel` corners, and a mono xs caption below in `--text-faint`. Real photos only — no stock, no illustrations.

## Motion

Expressive, but always in service of reading, and always on the notebook's terms: things are *written* and *drawn*, not bounced.

| What | How | Timing |
|---|---|---|
| Intro | The name and the location line write themselves in left to right (`clip-path`); the lead, roles and buttons settle up 8px. | 0.6–0.7s, 140ms apart |
| Hairlines | Every rule between entries draws from left to right as it reaches the screen. | 0.9s |
| Entries | The gutter and content of each entry slide up 14px and fade in, one entry after another. | 0.6s, 70ms stagger |
| Status | The dots beside `LIVE` and `CURRENT`, the current job on the timeline, the board's `LIVE` dot and the InMoov `next` stage pulse slowly, offset so they don't all beat together. | 2.6s cycle |
| Timeline | Each line between jobs draws downward as its job reaches the screen. | 1s, after 0.25s |
| Hover | Entries lift 2px and gain a shadow. | 0.25s |
| Skills | Lit entries gain a ring; the rest fade to 35%. | 0.3s |
| Progress | A 2px `--signal` line under the nav fills as you read down the page. | follows scroll |
| Links | The hover underline sweeps in. | 0.35s |
| Theme | Light/dark crossfades (View Transitions, where supported). | 0.35s |

**Rules that keep it accessible:**
- Content is only hidden for animation once the page script has run (`.js` on `<html>`). With JavaScript off, everything is simply there.
- `prefers-reduced-motion: reduce` turns all of it off, including the progress line.
- An entry that receives keyboard focus appears immediately, even if its animation hasn't run (`:focus-within`). The keyboard never lands on something invisible.
- The only looping motion is the heartbeat, which is slow, small, and never on more than a handful of dots at once.
