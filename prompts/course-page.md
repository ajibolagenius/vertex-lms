# Implementation prompt: Course detail page

## Goal

Build `/courses/[slug]` to match `design/vertex-course.png`, wired to the seeded Sanity content
through the existing server-only read layer. Read-only: breadcrumb, hero, "What you'll learn",
"Course Content" module list, and the sticky progress bar. Nothing on this page writes.

## Skills and docs read

- `AGENTS.md` — §3 (reference image is the source of truth, reuse existing components, responsive
  down to mobile), §5 (pages are read-only, Sanity reads are server side), §7 (module/lesson numbers
  derived from order; progress is a real feature keyed to Clerk — not built yet), §8 (course /
  module / lesson model), §12 (private dataset, read token server-only), §13 (checks).
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` —
  `params` is a Promise; `PageProps<'/courses/[slug]'>` types it.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` — page props.
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md`.
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md` — remote images need
  `images.remotePatterns`.
- No new Sanity skill work: the schema, the query and the seed all already exist.

## Code inspected

- `sanity/lib/queries.ts` — `COURSE_BY_SLUG_QUERY` already projects everything this page needs
  (card fields, `moduleCount`, `lessonCount`, summed `duration`, `price`, `instructor`,
  `learningOutcomes`, `modules[]` with per-module summed duration and dereferenced lessons), and
  `COURSE_SLUGS_QUERY` covers `generateStaticParams`. **No query changes.**
- `sanity.types.ts` — `COURSE_BY_SLUG_QUERY_RESULT` is generated and current; `overloadClientMethods`
  types `client.fetch` off `defineQuery`, so no hand-written result types.
- `sanity/lib/fetch.ts` / `client.ts` / `env.ts` / `image.ts` — `sanityFetch`, `server-only` client
  with the Viewer token, `urlFor`.
- `studio/schemaTypes/objects/learning-outcome.ts` — `icon` is one of eight names:
  `layers, workflow, gauge, rocket, sparkles, shield, puzzle, code`.
- `studio/scripts/seed/seed.ndjson` — 10 courses, each 4 modules × 3 lessons, 4 outcomes, picsum
  cover images. Verified live: `count(*[_type=="course"]) == 10`.
- `components/nav/breadcrumbs.tsx`, `ui/badge.tsx` (`variant="popular"`), `ui/button.tsx`
  (`Button`, `ButtonLink`, `size="xl"`), `ui/progress-bar.tsx`, `ui/card.tsx`,
  `nav/site-header.tsx`, `lib/utils.ts` — all reused as-is.
- `app/page.tsx` — owns the frame (`bg-hatch` + `max-w-[1440px] border-x`) and the blurred bar
  graphic inline; course cards there link nowhere yet.
- `app/globals.css` — `@theme` tokens (`paper`, `surface`, `line`, primary/neutral) and the type
  scale utilities.
- `proxy.ts` — only `/my-learning` is gated, so this route is public, as §7 requires.
- `next.config.ts` — empty; no `images.remotePatterns` yet.

## Measurements taken from the reference

`design/vertex-course.png` is 1024×1536, i.e. a 1024px viewport, so its pixels are CSS px (the frame
sits at x=32…992, matching the shipped `px-0 sm:px-8` gutters). Panel edges below come from a pixel
scan for the hairline colour, not estimates.

| Element | Value |
| --- | --- |
| Content column | x 66 → 946 inside the frame, i.e. 32px padding (`sm:px-8`) |
| Breadcrumb | ~27px below the header rule, 14px |
| Hero cover | 280×328, radius 16, x 65 → 345 |
| Hero text column | starts x=404 (60px gap), `POPULAR` badge, title, summary, meta row, buttons |
| Title | Playfair ~52px / 60px |
| Summary | ~17px / 31px, neutral-500, ~400px measure |
| Meta row | 16px lucide icons + 14px labels, ~36px apart, ~44px under the summary |
| Buttons | primary 205×56 (trailing arrow), outline 142×56, 17px apart |
| Outcomes panel | x 66→946, y 564→962, radius 16, 1px border, ~26px padding |
| Outcome cards | 2×2 grid, each ~404×140, 20px gap, 48px primary icon (1.5 stroke), Playfair ~19px title, 15px/28px description |
| Course Content head | Playfair ~24px, right-aligned `12 modules • 18h 24m` in 13px neutral-500 |
| Module panel | x 66→946, y 1038→1417, rows ~60px, full-width hairlines between rows |
| Module row | 29px numbered circle at x≈95 with a vertical connector between circles, Playfair ~15px title at x=153, 13px summary beneath, right-aligned duration at x≈873, 16px chevron at x≈910 |
| Show all pill | ~204×45, centred, straddling the panel's bottom border |
| Sticky bar | bordered card across the column, top y≈1450, radius 16, ~84px tall: "Your Progress" over "35% complete", a ~283×8 track, and a 213×55 primary CTA on the right |
| Decoration | the home page's blurred orange bars sit behind the page bottom |

## Decisions and assumptions

1. **Progress is presentational.** There is no progress document, no server route and no Clerk read
   yet (§7 describes the feature; nothing implements it). The bar renders **0% / "Not started"** —
   showing the reference's 35% would be inventing data, which §7 forbids. The component takes
   `percentComplete` and `resumeHref` props so the real feature drops in without touching markup.
2. **Both "Continue Learning" CTAs link to the course's first lesson**, `/lessons/<slug>`, and the
   breadcrumb links to `/courses`. Neither route exists yet, so both 404 until they land. Flagged.
   `/lessons/<slug>` is the right shape because `LESSON_BY_SLUG_QUERY` resolves a lesson by slug
   alone and derives its course by reverse reference.
3. **Module and lesson numbers come from array order** (§7): module index + 1, lesson `"{m}.{l}"`.
4. **The accordion is `<details>`/`<summary>`, not a client component.** Native disclosure gives
   keyboard support and semantics for free; the chevron rotates with `[&[open]>summary_svg]`. The
   page stays a pure server component — no `"use client"` anywhere.
5. **"Show all N modules" is a CSS-only disclosure** (`sr-only` checkbox + `peer-checked` label
   pill) that renders only when a course has more than six modules. Seeded courses have four, so it
   will not appear against current content. Still built, because the reference shows it.
6. **Outcome icons stay inside the schema's eight names.** The reference happens to show a database
   and a cloud glyph, which the schema does not offer and no seeded course uses; adding them is a
   schema change, so the map covers exactly the eight allowed values and falls back to `Sparkles`.
   Flagged.
7. **Bookmark is presentational**, like the header bell (§7 lists presentational surfaces): a real
   `<button>` with an accessible name that does nothing yet. Flagged.
8. **The instructor is not rendered** — the reference does not show one on this page, and §3 makes
   the reference the source of truth. The query still returns it for later. Flagged.
9. **Seeded covers are picsum photographs**, not the reference's black Next.js tile, so the hero art
   will not look like the mock. That is content, not layout.
10. **The bar graphic moves out of `app/page.tsx` into a shared component**, unchanged, because two
    pages now use it. No visual change to `/`.
11. **No new dependencies, no new UI primitives.** Formatting helpers go in one `lib/format.ts`
    because the catalog and lesson pages will need the same ones.

## Files to touch

```
app/courses/[slug]/page.tsx        new: the whole route (server component)
lib/format.ts                      new: formatDuration, formatCount, formatLevel
components/decor/chart-decoration.tsx  new: the blurred bar graphic, moved out of app/page.tsx
app/page.tsx                       use ChartDecoration instead of the inline copy
next.config.ts                     + images.remotePatterns for cdn.sanity.io
```

No changes to `sanity/lib/queries.ts`, the Studio schema, the seed, or `sanity.types.ts`.

## Requirements

- Server component; the Sanity read goes through `sanityFetch` with `COURSE_BY_SLUG_QUERY`.
- `generateStaticParams` from `COURSE_SLUGS_QUERY` with `fresh: true` (a stale CDN read drops routes).
- Unknown slug → `notFound()`. `generateMetadata` returns the course title and summary.
- Cover via `next/image` + `urlFor(...)`, using the stored `alt`, sized for 280×328 at 2x, `priority`.
- Every displayed value is derived from the document: total duration from the summed `duration`,
  counts from `moduleCount`, `studentCount` formatted as `2.1k`, level capitalised for display.
  Nothing invented, nothing hardcoded that Sanity supplies.
- Optional fields degrade: no `learningOutcomes` → the panel is not rendered; `popular` false → no
  badge; missing `studentCount` → that meta item is dropped; a module without a summary omits it;
  a module with no lessons still renders its row.
- Responsive: hero stacks (cover above text) below `lg`, outcomes grid collapses to one column,
  module rows keep number + title with the duration wrapping, the sticky bar stacks with a
  full-width track. Desktop matches the reference.
- Accessibility: one `<h1>`; `<details>` for the accordion; the chevron and numbered circles are
  `aria-hidden`; the show-all checkbox is `sr-only` with a real `<label>`; every interactive element
  keeps the project's `focus-visible:outline-2 outline-primary-500` treatment; the decoration is
  `aria-hidden`.
- Tokens over raw hex, lucide-react icons, `cn()` for class joins, lookup maps for variants.

## Security considerations

- The read token stays in `sanity/lib/client.ts`, which is `server-only`; this page never imports a
  token and adds no client component, so nothing crosses the boundary.
- Only the already-public `NEXT_PUBLIC_SANITY_*` values reach the browser, via `urlFor`'s CDN URLs.
- `images.remotePatterns` is scoped to `https://cdn.sanity.io/**`, not a wildcard host.
- The route is public by design (§7); nothing here is gated, nothing writes, no user input is read.

## Acceptance criteria

1. `/courses/nextjs-app-router-in-depth` renders the seeded course: cover, POPULAR badge, title,
   summary, level, total duration, module count, student count, both CTAs.
2. "What you'll learn" shows the four seeded outcomes with their mapped icons.
3. Course Content lists the four seeded modules in order, numbered 1–4, each with its summary and
   its summed duration; the show-all pill is absent at four modules.
4. Expanding a module reveals its three lessons, labelled `1.1`–`1.3`, each linking to
   `/lessons/<slug>` with its duration and a free-preview badge where applicable.
5. The sticky bar reads 0% / "Not started" and its CTA points at the first lesson.
6. `/courses/does-not-exist` returns the 404 page.
7. Desktop matches `design/vertex-course.png`; 375px wide has no horizontal scroll.
8. `/` and `/design-system` are visually unchanged.
9. No `"use client"`, no raw hex outside `globals.css`, no `any`, no hand-written query result types.

## Checks to run

```
npx tsc --noEmit
npm run lint
npm run build
npm run dev    # then the manual steps below
```

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/courses/nextjs-app-router-in-depth`.
2. Compare against `design/vertex-course.png` at 1024px wide: breadcrumb, hero, outcomes panel,
   course content list, sticky bar, decoration.
3. Click a module row — it expands to its three lessons; click again — it collapses; the chevron
   rotates. Tab through and confirm focus rings.
4. Click a lesson link and the "All Courses" crumb: both 404 (expected until those routes exist).
5. Scroll: the progress bar stays pinned above the page bottom, reading "Not started".
6. Resize to 375px: the hero stacks, outcomes go single column, no horizontal scroll.
7. Open `/courses/does-not-exist` → 404 page.
8. Open `/` and `/design-system` and confirm both are unchanged.
