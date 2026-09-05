# Implementation prompt: Vertex Home Page UI

## Goal

Build the Vertex home page at `/` to match `design/vertex-home.png` exactly: a hatched-gutter page
frame, a site header, a centred hero (eyebrow pill, serif display heading, sub-copy, primary CTA,
large search bar), an "All Courses" section with three course cards, a rule-flanked footnote row,
and the decorative orange bar graphic at the page bottom. Presentational only — no data, no auth,
no analytics.

## Skills and docs read

- `AGENTS.md` — §3 (reproduce the image exactly, responsive down to mobile, reuse existing
  components and Tailwind patterns first), §5 (pages are read-only), §7 (presentational surfaces:
  notification bell), §13 (checks), §14.
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` — page/layout
  conventions; nothing about this page needs a route group or a nested layout.
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md` — local images live in
  `public/` and are referenced from `/`; `next/image` for them.
- `company-logos` skill — brand marks come from Iconify Simple Icons in a square box, never typed
  company names, never hotlinked from search results.
- No Sanity / Clerk / PostHog skill applies: this task stores, reads and sends nothing.

## Code inspected

- `prompts/design-system.md` and the shipped design system (commit `7fec22d`): tokens in
  `app/globals.css` `@theme`, type-scale `@utility` classes, `cn()` in `lib/utils.ts`.
- `app/globals.css` — primary/neutral colours, radii, shadows, eight type-scale utilities, body
  set to `--color-neutral-50` + Inter.
- `app/layout.tsx` — Inter + Playfair as CSS variables, `body` is `min-h-full flex flex-col`, so a
  page can own its own full-height background with `flex-1`.
- `app/page.tsx` — still create-next-app boilerplate; this task replaces it.
- `components/nav/navbar.tsx` — logo + links, `active` renders in `primary-500`. Reusable as-is.
- `components/brand/logo.tsx`, `components/ui/button.tsx`, `components/ui/search-input.tsx`,
  `components/cards/course-card.tsx`, `components/ui/card.tsx` — all server components, all take
  `className`.
- `app/design-system/page.tsx` — consumes `Button` (`size="md"`, all variants/states),
  `SearchInput` (no size prop), `CourseCard` (no variant prop). Every change below is **additive**,
  so the sheet keeps rendering exactly as it does today.

## Measurements taken from the reference

Measured off `design/vertex-home.png` (1024×1536) by pixel-scanning glyph bounding boxes, so the
numbers below are the design's own values, not estimates.

| Element | Value |
| --- | --- |
| Page frame | hairline border at x=32 and x=992; diagonal hatch in the gutters outside |
| Header | 97px tall, 1px bottom rule spanning the frame; logo 24px; links 15px |
| Avatar / bell | 50px circle, 22px outline bell, 20px apart |
| Eyebrow pill | 210×40, 12px uppercase, ~0.15em tracking, 1px warm border, paper fill |
| Display heading | Playfair 64px / 72px, regular weight, centred, two lines |
| Sub-copy | 20px / 33px, `#4A5058`-ish → `neutral-700`, centred, two lines |
| CTA | 230×60, 16px medium, 12px radius, `primary-500`, trailing arrow |
| Search bar | 748×86, 14px radius, 1px border, 26px leading icon, 17px placeholder, 63×40 ⌘K chip inset 24px from the right |
| Section rule | full frame width at y=740 |
| "All Courses" | Playfair 28px; "View all courses" 15px `primary-500` + arrow |
| Card grid | 3 up, 16px gap, cards 856px total across, 370px tall |
| Card | 28px padding, 16px radius, 72px logo tile (16px radius), Playfair 22px title, 15px/25px description, hairline rule, 12px meta row pinned to the bottom |
| Footnote row | 22px outline star + 16px text, hairline rules filling both sides |
| Bar graphic | ~14 blurred bars, orange fading to transparent upward, one gap in the middle, cut off by the page bottom |

Sampled colours: page `#FBF8F6`, card `#FDFBFA`, hairlines `#F0E8E2`, heading `#000`.

## Decisions and assumptions

1. **The mock's palette is warmer than the design system's.** Its accent samples ~`#E4633C` and its
   surfaces are warm paper, where the design-system sheet labels `Primary 500 #F97316` on cool
   `#FAFAFC`. The labelled sheet wins for the accent — the home page uses `primary-500` — but the
   warm page/card/hairline colours are real and get three new tokens (`--color-paper #FBF8F6`,
   `--color-surface #FDFBFA`, `--color-line #F0E8E2`). Flagged for the user in the report.
2. **Body font stays Inter.** The mock's sub-copy renders in a geometric sans, but the design system
   fixes Inter, and one type system across pages matters more than one page's render. Flagged too.
3. **The frame is a centred `max-w-[1200px]` column** with `border-x` and the paper fill, sitting on
   a hatched background, so the gutters widen with the viewport exactly like the mock's do. Section
   padding is `px-12`; the header and section rules span the full frame.
4. **The hatch** is one `@utility` class in `globals.css` — a `repeating-linear-gradient` at 45°.
   No image asset.
5. **Additive variants, not new components.** `Button` gains `size="xl"`, `SearchInput` gains
   `size="hero"`, `CourseCard` gains `variant="feature"`. Each is one extra entry in a lookup map;
   no existing call site changes and no class-conflict risk, since `cn()` only joins.
6. **The eyebrow pill is a plain `<span>` in the page**, not a `Badge` variant — `Badge`'s base
   (6px radius, 8px padding) is a different object, and overriding all of it costs more than the
   one line it replaces.
7. **The page owns its content array.** Three hardcoded courses with copy taken verbatim from the
   image. Sanity replaces this later; nothing here pretends to be a data layer.
8. **Brand marks** are Iconify Simple Icons (`nextdotjs`, `docker`, `typescript`) downloaded once
   into `public/logos/` and rendered with `next/image` + `unoptimized` (Next refuses to optimise
   SVG). Following the mock, Next.js and TypeScript sit on filled brand tiles, Docker is the brand
   mark on a bare tile.
9. **The avatar is a placeholder** — an initials circle, since there is no photo asset and Clerk
   supplies the real one later. The bell is presentational per AGENTS §7.
10. **No `"use client"`.** The search bar and the bell are static markup on this page; the real
    search experience is its own feature. The input is `readOnly` so it cannot collect anything.
11. **Responsive:** the hero display drops via `clamp()`, the card grid goes 3 → 2 → 1, the header
    nav wraps, and the frame's gutters shrink to zero below `sm`.

## Files to create or change

```
app/page.tsx                      rewrite: the whole home page
app/globals.css                   + paper/surface/line tokens, + .bg-hatch utility
components/nav/site-header.tsx    new: frame header (Navbar + bell + avatar)
components/ui/button.tsx          + size "xl"
components/ui/search-input.tsx    + size "hero" (86px, boxed ⌘K chip)
components/cards/course-card.tsx  + variant "feature" (72px tile, serif title, meta pinned bottom)
public/logos/nextdotjs.svg        Iconify Simple Icons
public/logos/docker.svg           Iconify Simple Icons
public/logos/typescript.svg       Iconify Simple Icons
```

## Requirements

- Header: logo links to `/`, "Courses" → `/courses`, "My Learning" → `/my-learning`, neither active
  on `/` (matching the image, where both read dark). Bell is a `<button>` with an accessible name.
- Hero: eyebrow, `<h1>` in two explicit lines, sub-copy, CTA linking to `/courses`, search bar.
- Courses: `<h2>` "All Courses", "View all courses" link to `/courses`, three `CourseCard`s in a
  grid, each linking nowhere yet (no hrefs exist).
- Footnote row and the bar graphic are decorative: `aria-hidden` on the graphic, real text for the
  footnote.
- No raw hex outside `app/globals.css`.

## Security considerations

No data access, no env vars, no tokens, no network calls at runtime, no form submission, no
`dangerouslySetInnerHTML`. The logo SVGs are vendored into `public/`, not hotlinked. Nothing crosses
the server/client boundary — there are no client components.

## Accessibility

One `<h1>`; `<header>`/`<main>`/`<nav>` landmarks; the search input keeps a visually hidden label;
decorative icons and the bar graphic are `aria-hidden`; every interactive element is a real
`<button>`/`<a>` with a `focus-visible` ring in `primary-500`; the placeholder avatar has an
accessible name.

## Acceptance criteria

1. `/` renders header, hero, courses section, footnote row and bar graphic in reference order.
2. Side by side with `design/vertex-home.png` at desktop width: hatched gutters and frame rules,
   eyebrow pill, 64px Playfair heading over two lines, CTA, 86px search bar with the ⌘K chip, the
   three cards with their logo tiles and meta rows, and the footnote row all match.
3. The design system page at `/design-system` is visually unchanged.
4. No `"use client"`, no raw hex outside `globals.css`, every new prop typed.
5. 1440px → 375px with no horizontal scroll and no overlapping text.
6. `npx tsc --noEmit`, `npm run lint` and `npm run build` all pass.

## Checks to run

```
npx tsc --noEmit
npm run lint
npm run build
npm run dev    # then open / and /design-system
```

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/`.
2. Compare top to bottom against `design/vertex-home.png` — header, hero, cards, footnote, bars.
3. Open `/design-system` and confirm sections 07, 08 and 12 (buttons, inputs, cards) are unchanged.
4. Tab through the page — logo, both nav links, bell, avatar, CTA, search, "View all courses" each
   show an orange focus ring in that order.
5. Hover the CTA (darkens to `primary-600`) and "View all courses".
6. Resize to 1024, 768 and 375 — cards go 3 → 2 → 1, the hero heading shrinks, gutters collapse, no
   horizontal scrollbar.
7. Confirm the three brand marks render and the bar graphic is cut off by the bottom of the frame.
