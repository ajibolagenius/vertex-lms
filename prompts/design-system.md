# Implementation prompt: Vertex Design System

## Goal

Turn `design/vertex-designsystem.png` into the reusable foundation every later Vertex page builds
on: design tokens in Tailwind v4, a typed component library, and a `/design-system` showcase route
that reproduces the reference sheet section by section so it can be visually diffed against the image.

## Skills and docs read

- `AGENTS.md` (§3 UI work, §5 structure, §6 stack, §13 checks, §14 when in doubt).
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` — `next/font/google`, variable
  fonts preferred, font scoped via `className` on the root layout.
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md` — Tailwind v4 via
  `@tailwindcss/postcss`, single `@import "tailwindcss"` in `app/globals.css`, global CSS imported
  once in the root layout.
- No Sanity/Clerk/PostHog skill applies: this task is presentational only — no data, no auth.

## Code inspected

- `package.json` — Next 16.3.4, React 19.2.8, Tailwind v4, TypeScript, ESLint flat config. No UI deps.
- `app/globals.css` — create-next-app boilerplate: Geist font vars, `prefers-color-scheme` dark
  block, Arial body font.
- `app/layout.tsx` — Geist/Geist_Mono wired, typed `LayoutProps<"/">` root layout, `h-full antialiased`.
- `app/page.tsx` — create-next-app marketing boilerplate.
- `tsconfig.json` — `@/*` maps to repo root.
- `LMS_Vertex/prompts/design-system.md` — the bundled reference prompt for this task; this prompt is
  adapted from it (corrected filename, Next version, dependency choices).
- Repo is a single Next.js app at the root today; the Studio workspace from AGENTS.md §5 does not
  exist yet. This task touches only the web side, so nothing is restructured here.

## Decisions and assumptions

1. **Tokens live in `@theme` in `app/globals.css`** (Tailwind v4 CSS-first config). No
   `tailwind.config.ts`. Every sheet value becomes a token, so components use `bg-primary-500`,
   `text-neutral-500`, `shadow-md`, `rounded-md` and never a raw hex.
2. **Light only.** The sheet has no dark mode. The boilerplate `prefers-color-scheme` block and the
   Geist fonts are removed.
3. **Fonts:** Playfair Display (Display 1/2) and Inter (everything else) via `next/font/google` as
   CSS variables `--font-playfair` / `--font-inter`, exposed as `font-display` and `font-sans`.
4. **Type scale** ships as `@utility` classes (`.text-display-1`, `.text-heading-1`, `.text-body`, …),
   each pinning size, line height and weight from section 03, so a heading is one class not three.
5. **Spacing** — the sheet's 4px base unit is already Tailwind's default `--spacing`. No override;
   the scale (4/8/12/16/24/32/40/48/64) is only documented in the showcase.
6. **Icons: `lucide-react`** — a 24×24 grid, 2px stroke, rounded-cap set, matching section 06's icon
   spec exactly, and it covers every glyph shown. Filled style reuses the same components with
   `fill="currentColor"`. One dependency, versus hand-rolling and maintaining ~18 SVGs.
7. **No `clsx` / `tailwind-merge` / `cva`.** `lib/utils.ts` gets a three-line
   `cn(...parts: (string | false | undefined)[])` that filters and joins. Variants are plain lookup
   maps (`Record<Variant, string>`). Class conflicts are avoided by convention (variant maps own
   their properties), not by a merge library. Add `tailwind-merge` later only if override collisions
   actually show up.
8. **Components are server components by default.** Nothing in this task needs state: `SearchInput`
   and `Select` are built on native uncontrolled elements, the select styled with `appearance-none`
   plus a chevron — no JS dropdown, no `"use client"` anywhere.
9. **The Vertex logo** is hand-authored SVG (downward orange triangle with the notched inner "V") in
   `components/brand/logo.tsx`, sized by prop. No image asset.
10. **Cards are presentational** — explicit props (title, description, meta, href), no data fetching,
    matching AGENTS.md §5 "pages display stored data".
11. **The showcase is a real route** at `app/design-system/page.tsx`, statically rendered, built only
    from the library components with sample copy taken verbatim from the reference image.
12. **`app/page.tsx` is left as-is** apart from inheriting the new base styles. Replacing the home
    page is a separate feature, out of scope.
13. **Responsive:** the reference is desktop only. Section grids collapse to one or two columns below
    `md`; card and control internals keep their desktop metrics (44px height, 12px radius).

## Token values (from the sheet)

| Group | Tokens |
| --- | --- |
| Primary | 500 `#F97316`, 400 `#FB923C`, 300 `#FDBA74`, 200 `#FED7AA`, 100 `#FFEEE5` |
| Neutral | 900 `#0F172A`, 700 `#334155`, 500 `#64748B`, 300 `#CBD5E1`, 200 `#E2E8F0`, 100 `#F1F5F9`, 50 `#FAFAFC`, white `#FFFFFF` |
| Radius | xs 4, sm 8, md 12, lg 16, xl 24, full |
| Shadow sm | `0 1px 2px 0 rgba(15,23,42,0.05)` |
| Shadow md | `0 4px 12px -2px rgba(15,23,42,0.08)` |
| Shadow lg | `0 12px 24px -4px rgba(15,23,42,0.10)` |
| Shadow xl | `0 20px 40px -8px rgba(15,23,42,0.12)` |

Type scale — Display 1 Playfair 48/56 bold, Display 2 Playfair 36/44 bold, Heading 1 Inter 28/36
semibold, Heading 2 Inter 22/30 semibold, Heading 3 Inter 18/26 medium, Body Large Inter 16/24
regular, Body Inter 14/20 regular, Small Inter 12/16 regular.

Supporting values not in the swatch rows (added as tokens): primary-600 hover `#EA580C`, success
`#16A34A`, lesson badge `#EEF0FE` bg / `#4F46E5` text.

## Files to create or change

```
app/globals.css                         rewrite: tokens, base styles, type-scale utilities
app/layout.tsx                          Playfair + Inter, Vertex metadata
app/design-system/page.tsx              the 14-section showcase
lib/utils.ts                            cn()
components/brand/logo.tsx               Logo (mark + wordmark)
components/ui/button.tsx                Button (primary|secondary|tertiary|text × lg|md, disabled)
components/ui/badge.tsx                 Badge (video|lesson|popular)
components/ui/status-indicator.tsx      StatusIndicator (in-progress|completed|now-playing|locked)
components/ui/progress-bar.tsx          ProgressBar (value, optional label)
components/ui/search-input.tsx          SearchInput (icon, placeholder, ⌘K hint)
components/ui/select.tsx                Select (native, chevron)
components/ui/card.tsx                  Card shell (surface, border, radius, shadow)
components/cards/course-card.tsx        CourseCard
components/cards/lesson-video-card.tsx  LessonVideoCard
components/cards/lesson-card.tsx        LessonCard
components/cards/resource-card.tsx      ResourceCard
components/nav/navbar.tsx               Navbar (logo + links, active state)
components/nav/breadcrumbs.tsx          Breadcrumbs (items, chevron separators)
components/nav/pagination.tsx           Pagination (current, total, ellipsis, prev/next)
package.json                            + lucide-react
```

## Requirements per section

- **01 Colors** — every swatch as a `@theme` token; showcase grid with name + hex.
- **02/03 Typography** — both families loaded; eight scale utilities; the spec table rendered exactly
  as the sheet does (Style, Font, Size/Line Height, Weight, Use).
- **04 Spacing** — nine squares with px and rem labels.
- **05 Radius & shadows** — six radius chips, four shadow cards with their CSS values printed.
- **06 Icons** — outline row and filled row, both 24px, plus the four spec bullets.
- **07 Buttons** — four variants × default/hover/disabled. Primary: `bg-primary-500`, hover
  `primary-600`, disabled `bg-primary-100` with `text-primary-300`. Secondary: 1px `primary-500`
  border, `primary-500` text, hover `bg-primary-100`. Tertiary: white surface, `neutral-200` border,
  `neutral-900` text, external-link icon, hover `neutral-50`. Text: `primary-500` label with circled
  play icon, no surface. All 44px tall, 12px radius, Inter medium 14–16px; `lg` = 0 16px padding,
  `md` = 0 12px. Disabled sets `disabled:cursor-not-allowed` and blocks pointer events. Every variant
  has a visible `focus-visible` ring in `primary-500`.
- **08 Inputs** — 44px height, 12px radius, 1px `#E2E8F0` border, 0 16px padding, focus border
  `#FB923C`; search has a leading search icon and a trailing ⌘K chip; select has a chevron.
- **09 Badges** — VIDEO (`primary-100` bg, `primary-500` text), LESSON (`#EEF0FE` bg, `#4F46E5`
  text), POPULAR (`primary-100` bg, `primary-500` text, semibold). Uppercase, 12px, tracked, 6px radius.
- **10 Status** — In Progress (partial orange ring), Completed (green check circle), Now Playing
  (filled orange play circle), Locked (neutral lock), each with its label.
- **11 Progress bar** — 8px track `neutral-100`, `primary-500` fill, rounded full, percent label,
  `role="progressbar"` with `aria-valuenow/min/max`.
- **12 Cards** — white surface, `neutral-200` border, 16px radius, `shadow-sm`, 20–24px padding.
  Course card: square dark logo tile, title, description, meta row (level, duration, modules) with
  icons. Lesson (video) card: VIDEO badge, title, description, footer `Lesson 5.1 · 12:45` plus an
  orange "Watch from 12:45" action. Lesson card: LESSON badge, title, description, footer `Module 5`
  plus "View lesson" with external-link icon. Resource card: file icon, title, description, footer
  `PDF · 1.2 MB` plus external-link action.
- **13 Navigation** — navbar (logo left, Courses active in `primary-500`, My Learning in
  `neutral-900`), breadcrumbs with chevron separators and a muted current page, pagination with a
  boxed current page in `primary-500` border/text, ellipsis, prev/next chevrons.
- **14 Principles** — four icon + title + description blocks.

## Security considerations

Presentational only: no data access, no tokens, no env vars, no network calls, no persisted input.
No `dangerouslySetInnerHTML`. No client component receives a secret — there are no client components.
Nothing crosses the server/client boundary rules in AGENTS.md §5.

## Accessibility

Real `<button>`/`<a>` elements with `focus-visible` rings; visually hidden labels on the search input
and select; ARIA values on the progress bar; `<nav aria-label="Pagination">` with `aria-current="page"`;
breadcrumbs as `<nav aria-label="Breadcrumb">` + ordered list with `aria-current="page"`; decorative
icons `aria-hidden`.

## Acceptance criteria

1. `/design-system` renders all 14 numbered sections in reference order with matching headings.
2. Side by side with `design/vertex-designsystem.png`: colors, type, radii, shadows, button states,
   badges, cards, nav and pagination match — same hexes, 44px controls, 12px/16px radii.
3. No component contains a raw hex outside `app/globals.css`.
4. All components are typed, exported, and accept a `className` override.
5. Responsive from 1440px to 375px with no horizontal scroll and no overlapping text.
6. No `"use client"` in this task's components.
7. `npx tsc --noEmit`, `npm run lint` and `npm run build` all pass.

## Checks to run

```
npx tsc --noEmit
npm run lint
npm run build
npm run dev      # then open /design-system
```

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/design-system`.
2. Compare against `design/vertex-designsystem.png` top to bottom; each numbered section matches.
3. Hover every button variant — primary darkens, secondary fills peach, tertiary greys, text stays orange.
4. Tab through the page — every button, link, input and pagination control shows a visible focus ring.
5. Focus the search input — the border turns `#FB923C`.
6. Resize to 768px and 375px — sections stack, cards stay readable, no horizontal scrollbar.
7. Confirm headings render in Playfair Display and body text in Inter, with no fallback flash.
