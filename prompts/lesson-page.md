# Lesson page from `design/vertex-lesson.png`, wired to seeded Sanity content

## Goal

Ship `/lessons/[slug]` — the two-column lesson page in the reference: a course sidebar with
the module/lesson tree, and a main column with breadcrumbs, lesson header, a **playing**
YouTube embed, tabbed lesson content, pro tip, resources, and a prev/next lesson bar.

Everything renders from the seeded dataset. The video plays **on the page** via the
provider's own embed (AGENTS §7 — no custom player, never send the learner to YouTube).

## Skills and docs read

- `AGENTS.md` §3 (UI is reproduced from the reference), §5 (server/client boundaries),
  §7 (embed playback + start-seconds param, presentational surfaces), §8 (data model),
  §11 (result → lesson deep link), §12 (private dataset, token stays server-side).
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` —
  `params`/`searchParams` are promises; `searchParams` opts a route into **dynamic
  rendering**. That is why the start-seconds param is read in the client player behind a
  `<Suspense>` boundary instead of on the server: the route keeps its
  `generateStaticParams` prerender.

## Code and data inspected

- `app/courses/[slug]/page.tsx` — frame (`bg-hatch` + `max-w-[1440px] border-x bg-paper`),
  `SiteHeader`, `Breadcrumbs`, CSS-only `<details>` disclosure, numbered-circle module rows
  with the vertical connector, the `LESSON_ROUTE_READY = false` flag gating lesson links.
- `sanity/lib/queries.ts` — `LESSON_BY_SLUG_QUERY` already returns the lesson plus the
  reverse-referenced course and its full module tree. `LESSON_SLUGS_QUERY` exists.
- `sanity/lib/{fetch,image,client}.ts` — `sanityFetch` is `server-only`; `urlFor` for images.
- `components/ui/{badge,button,card,progress-bar}.tsx`, `components/nav/*`,
  `components/course-actions.tsx`, `lib/format.ts` (`formatDuration`, `formatLevel`).
- `studio/schemaTypes/documents/lesson.ts` + `studio/scripts/seed/seed.ndjson`:
  - 120 lessons, **every `videoUrl` is `https://www.youtube.com/watch?v=<id>`**.
  - `thumbnail` is a real Sanity asset (uploaded from `i.ytimg.com`) → `cdn.sanity.io`,
    already allowed in `next.config.ts`.
  - `notes` is Portable Text: exactly **two** `normal` non-list paragraphs per lesson, plus
    an `h2` ("What this lesson covers") and a bullet list whose items are **verbatim
    duplicates of `keyPoints`**.
  - `keyPoints` on all 120 lessons; `proTip` on 34; `resources[].type` is always `link`.
- `design/vertex-lesson.png` is 1024×1536, i.e. a 1024px viewport, so its pixels are CSS px.
  Measured landmarks below.

## Measured geometry (1024px reference)

| Thing | Measurement |
|---|---|
| Frame | x 31 → 993, hatch gutters outside |
| Header rule | y 85 (reuse the shipped `SiteHeader`) |
| Sidebar | x 32 → 310 (278px incl. its right hairline), rule stops at y 1443 |
| Main column | x 348 → 956, i.e. 36px padding (`px-9`) inside the sidebar rule |
| Breadcrumb | ink y 124–135, ~36px under the header rule |
| `LESSON 5.1` badge | y ~172–192, primary-100 / primary-500, uppercase |
| Title | Playfair ~52/60, ink y 215–251 |
| Lede | ~17/26 neutral-500, two lines, ~455px measure |
| Meta row | 16px icons + 14px labels, ink y 342–356 |
| Video | x 348–956, y 384–728 → **608×343, 16:9**, radius 12–16, black |
| Tab strip | ink y 772–781, active underline y 797–799, hairline across the column |
| Tab content column | x 366 → 940 — **inset 16px** either side vs the video |
| Overview head | Playfair ~20px, ink y 832–844 |
| Overview body | ~15/23 neutral-500 |
| Divider | y 950 |
| "In this lesson you will:" | Inter semibold ~15px, ink y 979–991 |
| Checklist | 20px `CircleCheck` primary outline, rows 31–32px apart |
| Pro Tip | panel y 1157–1256 (100px), primary-100 wash, radius 12, lightbulb + Playfair title |
| Divider | y 1281 |
| Resources | Playfair head y 1299–1310; 3 cards y 1332–1428 (96px), ~188px wide, ~11px gap |
| Footer bar | full frame width, top rule y 1443, ~92px tall, 56px buttons |

Sidebar: "← Back to course" (primary) at y 123–132; a 50×50 rounded cover thumb at
x 72 with the course title, "35% complete" and a slim progress track; a
"Module N of M" header row with a chevron; then module rows — ~22px numbered circle
threaded by a vertical connector, title + duration, and a trailing state icon. The current
module is tinted, its circle is filled primary, and it is the only one expanded; its lessons
are listed with a dot marker, and the current lesson shows "Now playing" in primary plus a
filled primary play button.

## Decisions and assumptions

1. **Route** `app/lessons/[slug]/page.tsx`, `generateStaticParams` over `LESSON_SLUGS_QUERY`,
   `generateMetadata` from the lesson. `LESSON_ROUTE_READY` in the course page flips to
   `true` so course lesson rows and both "Continue Learning" CTAs link here.
2. **Playback is a facade, then the provider's player.** Poster (`lesson.thumbnail` via
   `urlFor`) + a play button; on click it swaps in
   `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&start=<t>&rel=0`. No third-party
   script until the learner presses play, one honest place to capture `video_played`, and
   the player chrome is YouTube's own — AGENTS §7 forbids a custom player.
3. **Start seconds is `?t=`** (the param a search result will carry, AGENTS §7/§11). It is
   read with `useSearchParams()` inside the client player, wrapped in `<Suspense>` so the
   page still prerenders. `youtubeId()` handles `watch?v=`, `youtu.be/` and `/embed/`;
   anything else renders the poster with no play control — Vimeo and Bunny are **not**
   claimed as supported, because neither ingestion nor playback exists for them (AGENTS §9).
4. **Overview = the notes' `normal` non-list blocks.** The first is the lede under the title;
   the rest render as Overview. The `h2` + bullet blocks are skipped because `keyPoints`
   already renders that same list as the "In this lesson you will:" checklist — rendering
   both would print the seed's content twice. Rendered with `@portabletext/react`, which is
   promoted from a transitive dep of `next-sanity` to an explicit dependency.
5. **Progress is presentational** (AGENTS §7 — the progress record is not built). The sidebar
   takes a `completedLessonIds: string[]`, currently `[]`, and derives the percentage and the
   completion ticks from it. Wiring the real Clerk-keyed record later touches only that prop.
6. **Prev/next** are the neighbours in the course's flattened lesson list (the reference's bar
   is mocked with module titles, but it is labelled "Previous/Next **Lesson**").
7. **Tabs** are a small client component with `role="tablist"` and arrow-key navigation, taking
   the server-rendered panels as props. The Notes tab is presentational (AGENTS §7): an empty
   state, no storage.
8. **Instructor is not rendered.** AGENTS §8 asks for it on the lesson, but the reference does
   not show it and §3 makes the reference the source of truth. Flagged in the report.
9. Student count renders as `3,426` (`toLocaleString`), matching the reference — not the
   catalog's `3.4k` `formatCount`.
10. `SiteHeader` is reused as shipped (`h-[97px]`), although both references put the header
    rule at y 85. Changing it would move every other page; left alone deliberately.

## Files

| File | Change |
|---|---|
| `app/lessons/[slug]/page.tsx` | new — the page, sidebar, content, footer bar |
| `components/lesson/video-player.tsx` | new — `"use client"` YouTube facade + embed, `?t=`, PostHog |
| `components/lesson/lesson-tabs.tsx` | new — `"use client"` tabs, Notes empty state |
| `components/lesson/lesson-sidebar.tsx` | new — course card, module/lesson tree |
| `lib/video.ts` | new — `youtubeId(url)`, `embedUrl(id, startSeconds)` + a self-check |
| `sanity/lib/queries.ts` | add per-module `duration` to the lesson query's module tree |
| `sanity.types.ts` | regenerated by `npm run typegen` |
| `app/courses/[slug]/page.tsx` | `LESSON_ROUTE_READY = true` |
| `components/course-actions.tsx` | add the icon-only bookmark button used in the lesson header |
| `package.json` | add `@portabletext/react` |

## Requirements

- Desktop matches the reference at 1024px: geometry table above.
- Responsive with no horizontal scroll at 375px: the sidebar becomes a collapsed
  `<details>` above the content, the video keeps 16:9, resources stack, the footer bar wraps.
- Sidebar disclosure is native `<details>` — no JS for module expand/collapse.
- Keyboard: tabs are arrow-navigable, the play button is a real `<button>`, every focusable
  element keeps the project's `focus-visible` ring.
- `alt` text comes from the Sanity image `alt` field; the poster is decorative inside a
  labelled play button.

## Security

- The page is a server component; `sanityFetch` stays `server-only` and the read token never
  reaches the browser (AGENTS §12).
- No writes: nothing on this page mutates content or progress.
- The embed is `youtube-nocookie.com`, loaded only after an explicit click, `allowfullscreen`
  with a scoped `allow` list — no `allow-same-origin` sandbox escape, no autoplay on load.
- Resource links are author-supplied URLs → `target="_blank" rel="noopener noreferrer"`.
- PostHog captures slugs and seconds only, no PII.

## Analytics (AGENTS §7)

- `lesson_viewed` on mount — lesson slug/title, course slug, module index.
- `video_played` on the first play — lesson slug, start seconds.
- "How far it is watched" and `lesson_completed` need the YouTube IFrame API and the progress
  record; both are out of scope here and called out in the report.

## Acceptance criteria

1. `/lessons/<any seeded slug>` renders: breadcrumbs, `LESSON n.m` badge, title, lede, meta
   row, video, tabs, Overview, checklist, Pro Tip (when authored), Resources, prev/next bar.
2. Clicking the poster plays the lesson's YouTube video inline; the page never navigates out.
3. `/lessons/<slug>?t=125` starts playback at 2:05.
4. The sidebar shows the whole course, only the current module expanded, the current lesson
   marked "Now playing".
5. Course page lesson rows and "Continue Learning" now navigate to the lesson page.
6. A lesson with no `proTip` omits the Pro Tip panel; one with no `resources` omits Resources.
7. First and last lessons of a course hide the missing prev/next side.
8. 375px wide: no horizontal scroll.

## Checks

```
npx tsc --noEmit
npx eslint
npm run build          # new route + client components
```

## Manual test

1. `npm run dev`, open `/courses/nextjs-app-router-in-depth`, click a lesson row.
2. Compare against `design/vertex-lesson.png` at 1024px wide.
3. Press the poster — the video plays in place, page URL unchanged.
4. Open the same lesson with `?t=125` and press play; it starts at 2:05.
5. Click the second module in the sidebar — it expands, the current one stays marked.
6. Tab to "Notes", then arrow back to "Lesson Content".
7. Use the footer bar to walk to the next lesson and back.
8. Resize to 375px: sidebar collapses above the content, nothing overflows.
9. PostHog live events show `lesson_viewed` then `video_played`.
