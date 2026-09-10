# Redesign + new features

## Goal

Move Vertex off the follow-along tutorial's visual identity and add four learner features
that build on data the project already stores. Two halves:

1. **A new design language** ("Signal"), owned by us, with light and dark themes and a
   theme toggle. Same information architecture where it works, new layout where the
   tutorial's centred-marketing shape is holding the product back.
2. **Four features**: in-lesson transcript panel, ask-this-lesson AI, lesson quizzes +
   streaks, and collections / learning paths.

This is large. It ships in **six phases**, each independently mergeable, each ending in a
working app. Phase 1 is an approval gate: the `/design-system` page is the reference, and
nothing else is restyled until it is signed off.

## Skills / docs read

- `AGENTS.md` (all sections; §3 UI rule is inverted for this task — see Decisions).
- `node_modules/next/dist/docs/` — App Router boundaries, `PageProps`/`LayoutProps` typed
  helpers already in use, `useSearchParams` + Suspense prerender rule.
- Existing prompts in `prompts/` for the conventions each surface was built to.
- Package docs for Clerk, PostHog, AI SDK v7, next-sanity as needed per phase.

## Code inspected

- `app/globals.css` — Tailwind v4 `@theme` tokens: orange primary, warm paper
  (`--color-paper #fbf8f6`), `--color-line`, Playfair display scale, `bg-hatch` utility.
- `app/layout.tsx` — Inter + Playfair via `next/font/google`, ClerkProvider, PostHogIdentify.
- `app/page.tsx`, `app/courses/`, `app/courses/[slug]`, `app/lessons/[slug]` (446 lines),
  `app/search`, `app/my-learning`, `app/design-system` (643 lines).
- `components/` — 24 components: `ui/` primitives, `cards/`, `lesson/`, `nav/`, `search/`,
  `decor/chart-decoration.tsx`, `course-actions.tsx`.
- `components/lesson/video-player.tsx` — poster facade, YT IFrame API loaded on play,
  5s poll for watch milestones + resume writes. **No seek control exposed today.**
- `app/api/progress/route.ts` — the only write path. `progress.<userId>.<lessonId>`,
  `createIfNotExists` + `patch`, Clerk `auth()` server-side, `SANITY_ID` regex guard.
- `app/api/search/route.ts`, `lib/search/{ground,keyword,rank,mcp,system-prompt,types}.ts`
  — MCP + LLM, grounded against Sanity, keyword fallback.
- `studio/schemaTypes/` — `course`, `lesson`, `instructor`, `category`, `video`
  (`chapters[]`, `chunks[{startSeconds,text}]`, read-only, ingested), `progress`.
- `sanity/lib/queries.ts` (9 queries), `fetch.ts`, `write-client.ts`, `proxy.ts`.
- `studio/scripts/videos/` — the offline ingestion pattern to copy for quizzes.

## Decisions and assumptions

**Design ownership.** AGENTS.md §3 says the user supplies the design. The user has
explicitly asked me to propose one instead, for this task only. §3 still governs any
future reference image.

**The Signal direction.** One design language, two themes:

| | Light | Dark |
|---|---|---|
| canvas | `#FAFAFA` | `#0B0C0E` |
| surface | `#FFFFFF` | `#141619` |
| line | `#E6E6E6` | `#26282D` |
| text | `#111214` | `#F4F4F5` |
| muted | `#6B6F76` | `#9A9EA6` |
| accent | `#5B4BE8` | `#7C6CF7` |

- **No serif.** Playfair is dropped. Inter for everything, plus **Space Mono** for
  metadata, timestamps, durations, counts and labels — a mono timestamp is functional in a
  product whose whole pitch is deep-linking to a second, not decoration.
- **Borders, not shadows.** Shadow tokens shrink to two (`sm` for popovers, `md` for
  modals). Radius drops from 4/8/12/16/24 to 2/6/10/16.
- **No hatch, no frame.** The `bg-hatch` gutters and the `max-w-[1440px] border-x`
  envelope go. Content sits in a 1240px column on a plain canvas.
- **Layout changes** (this is what makes it not-a-reskin):
  - Home: search-first. A large query field with example queries is the hero; the marketing
    paragraph shrinks to one line. Courses below as a dense grid.
  - Catalog: filter rail (category, level) + result grid, mono metadata row per card.
  - Lesson: a workspace rather than an article — course tree | video + notes | **right
    rail** carrying the transcript / ask / quiz panels. Phase 2 builds the first two
    columns; the rail arrives with its first occupant in phase 3, and phase 3 is the
    authoritative description of the final layout. Stacks on mobile.
  - Search: results keep their two card kinds, restyled; sort control moves inline with
    the count.

**Theme toggle.** `data-theme="light|dark"` on `<html>`, tokens defined on `:root`,
re-declared under `@media (prefers-color-scheme: dark) :root:not([data-theme=light])` and
`[data-theme=dark]`. Persisted in `localStorage`; a ~10-line inline script in `<head>`
sets the attribute before paint so there is no flash. **No `next-themes` dependency** —
that library is ~40 lines of value here.

**Transcript panel.** The chunks are already ingested. New `VIDEO_BY_URL_QUERY` fetched
server-side on the lesson page, rendered in the right rail with a filter box and
click-to-seek. Seeking needs the player: `components/lesson/video-player.tsx` grows a
small React context (`LessonPlayerProvider`) exposing `seekTo(seconds)`, implemented with
the YT IFrame API instance it already creates. Clicking a line before playback has started
starts it at that second. Chapters render as the panel's collapsible headings; a video
with no chapters renders a flat chunk list.

**Ask this lesson.** New `POST /api/lesson-qa`. **It does not use the MCP** — the scope is
one lesson, so the route selects that lesson's most relevant chunks itself by reusing
`tokenize()` from `lib/search/keyword.ts`, and sends at most **20 chunks + the notes plain
text** to the model. That respects §12's never-send-a-whole-transcript rule structurally,
not by instruction. The answer is returned with `citations: [{startSeconds, label}]`, and
**every citation is validated against the real chunk `startSeconds` before it leaves the
route** — an invented timestamp is dropped, same grounding contract as search. Requires a
signed-in user (`auth()`), which is also the cost control. Answers stream into the rail.

**Quizzes.** Generated **offline**, not per request — mirroring `studio/scripts/videos/`.
New `studio/scripts/quizzes/generate.mjs` reads a video's chunks, produces 3–5 questions
per lesson, and writes them to the lesson document as a new `quiz` array of
`{question, options[], answerIndex, explanation, startSeconds}`. `startSeconds` points at
where the answer is taught, so a wrong answer offers "watch that moment". Runtime just
renders and grades — grading is a pure function in `lib/quiz.ts` with a runnable check.
The score posts to `/api/progress` via two new optional fields on the `progress` document:
`quizScore` (0–100) and `quizTakenAt`.

**Streaks.** No new storage. A streak is derived in `lib/streak.ts` from the distinct UTC
days present in the learner's existing `progress.updatedAt` values. Pure function, runnable
check, shown on `/my-learning` and in the header when signed in.

**Collections.** One new `collection` document type: `{title, slug, description, owner
(clerk user id, optional), lessons[]}`. A document with an `owner` is a learner's own list
(written only through `POST /api/collections`, ownership checked from `auth()`); a document
with no `owner` is an author-curated learning path published in the Studio. Same type, same
rendering, no second code path. New routes `/collections` and `/collections/[slug]`, a
"Save" control on the lesson page and on search result cards. `/collections` is added to
the protected matcher in `proxy.ts` only for the *my lists* view; curated paths stay public.

**Also fixed in passing.** `app/lessons/[slug]/page.tsx` still has
`const COMPLETED_LESSON_IDS: string[] = []` with a comment saying progress is not
implemented. It is — the sidebar's completion ticks are dead. Phase 2 wires them to the
real records.

**Explicitly not doing:** author-curated path *editing UI* in the app (Studio does it),
per-learner note taking in the Notes tab (still presentational per §7), quiz question
authoring UI, semantic search, and any new runtime dependency beyond a Google font.

## Phases and files

### Phase 1 — Design system (approval gate)
- `app/globals.css` — replace the `@theme` block: colour tokens as CSS variables that flip
  per theme, new radius/shadow scale, drop `bg-hatch`, drop the display serif utilities,
  add mono utilities.
- `app/layout.tsx` — swap Playfair for Space Mono and Orbitron, add the no-flash theme script.
- `components/ui/theme-toggle.tsx` (new), added to `components/nav/header-actions.tsx`.
- `components/ui/*` and `components/brand/logo.tsx` — the primitives *are* the design
  system, so they are restyled here rather than in phase 2: the sheet has to show the new
  language, not old components tinted. (Moved up from phase 2 during implementation.)
- `app/design-system/page.tsx` — rebuilt as the reference for the new language, both themes.

### Phase 2 — Restyle (done)
- `components/shell.tsx` (new) — header plus the 1240px column, replacing the hatched
  gutters and the bordered 1440px envelope every page repeated.
- `components/cards/*`, `components/nav/*`, `components/search/*`, `components/lesson/*`.
- `components/catalog/catalog.tsx` (new) — the filter rail, filtering client-side so
  `/courses` stays prerendered.
- `components/course/{course-content,course-progress}.tsx` (new) — the module tree and
  the resume control, both reading real progress.
- `lib/use-progress.ts` (new) + `GET /api/progress` now returns the learner's records.
  **Progress is read client-side on purpose**: calling `auth()` in the lesson, course and
  catalog pages would have made all 130 of them dynamic. They stay prerendered.
- Deleted: `components/decor/chart-decoration.tsx` (old identity), and
  `components/cards/{lesson-card,lesson-video-card,resource-card}.tsx`, which only the
  old design-system sheet rendered.
- The lesson page is a two-column workspace (tree + article); the transcript/ask/quiz
  rail is added as the third column in phase 3 rather than shipped empty here.
- `app/page.tsx` (search-first hero), `app/courses/page.tsx` + filter rail,
  `app/courses/[slug]/page.tsx`, `app/lessons/[slug]/page.tsx` (two-column workspace —
  the third column is phase 3's, see below),
  `app/search/page.tsx`, `app/my-learning/page.tsx`, sign-in/sign-up (Clerk appearance).
- Lesson sidebar completion ticks wired to real progress.

### Phase 3 — Transcript panel (done)
- `sanity/lib/queries.ts` — `VIDEO_BY_URL_QUERY`; `sanity.types.ts` regenerated.
- `components/lesson/player-context.tsx` (new) — two contexts, stable controls and a
  ticking position, so registering the player is a one-shot effect.
- `components/lesson/video-player.tsx` — exposes `seekTo`, reports its position, and the
  poll drops from 5s to 2s so the highlight tracks the video. A click before playback
  starts the embed at that second instead of seeking a player that does not exist yet.
- `components/lesson/transcript-panel.tsx` (new) — filter, chapter headings, click to
  seek, auto-follow.
- `lib/transcript.ts` + `lib/transcript.check.mjs` (new, `npm run check:transcript`) —
  the grouping and active-line logic, out of the component so it is testable.
- `app/lessons/[slug]/page.tsx` — the rail becomes the third column, wrapping under the
  other two below `xl`.
- `app/layout.tsx` — the theme script moved to `next/script` with `id="vertex-theme"` and
  `strategy="beforeInteractive"` (Next 16.3.4). React 19 renders built-in `<script>`
  elements perfectly well; what it does not do is execute one rendered on the client,
  and it says so in the console. A pre-paint inline script therefore belongs in
  `next/script`, which injects it into the initial HTML ahead of any Next.js module.

### Phase 4 — Ask this lesson (done)
- `app/api/lesson-qa/route.ts` (new) — sign-in required, Zod-validated, a 10/min
  in-memory throttle keyed on the Clerk user, and generic client-facing errors.
- `lib/lesson-qa/{types,select,prompt}.ts` (new) + `select.check.mjs`
  (`npm run check:lesson-qa`).
- `sanity/lib/queries.ts` — `LESSON_QA_CONTEXT_QUERY`; types regenerated.
- `components/lesson/ask-panel.tsx` and `components/lesson/lesson-rail.tsx` (new) — the
  rail now carries Transcript / Ask tabs; a lesson with no ingested transcript gets Ask
  alone.
- `.env.example` — optional `OPENAI_LESSON_MODEL`.

Two deviations from the plan above, both deliberate:
- **The answer does not stream.** Citations are validated server-side before anything
  reaches the browser, which a streamed object cannot offer. A short answer over 20
  excerpts is a few seconds, and the panel says what it is doing.
- **Citations are excerpt INDEXES, not seconds.** The route numbers the excerpts it
  sends and maps the numbers back to real chunk seconds. An index the model invents is
  out of range and is dropped; a second it invents would look plausible. Grounding by
  structure rather than by instruction.

### Phase 5 — Quizzes + streaks
- `studio/schemaTypes/objects/quiz-question.ts` (new), `documents/lesson.ts` (+`quiz`),
  `documents/progress.ts` (+`quizScore`, `quizTakenAt`).
- `studio/scripts/quizzes/{generate.mjs,README.md}` (new).
- `lib/quiz.ts` + `lib/quiz.check.mjs`, `lib/streak.ts` + `lib/streak.check.mjs`.
- `app/api/progress/route.ts` — accept the two new fields (same schema-guard style).
- `components/lesson/quiz-panel.tsx` (new), `app/my-learning/page.tsx` (streak).

### Phase 6 — Collections
- `studio/schemaTypes/documents/collection.ts` (new).
- `sanity/lib/queries.ts` — collection queries.
- `app/api/collections/route.ts` (new), `app/collections/page.tsx`,
  `app/collections/[slug]/page.tsx` (new), `components/collections/save-button.tsx` (new).
- `proxy.ts` — protect the personal view.

## Requirements

- Every page responsive to ~375px. Desktop is the reference; the lesson rail and course
  tree collapse rather than shrink.
- Both themes pass WCAG AA for body text and UI text against their surfaces.
- Reuse existing primitives before adding any; no new npm dependency.
- No page loses a capability in the restyle — progress, resume, analytics events,
  breadcrumbs, empty states and pagination all survive.
- Existing PostHog events keep their names and properties. New events:
  `transcript_seek`, `lesson_question_asked`, `quiz_completed`, `collection_saved`,
  `theme_changed`.

## Security

- Nothing moves across the §5 boundaries. The browser gains no token, never calls the LLM
  or the MCP, and every new write goes through a server route with `auth()`.
- `/api/lesson-qa`: sign-in required, `lessonId` validated with the same `SANITY_ID` regex,
  question length capped (≤500 chars), chunk payload capped at 20, model output validated
  with Zod, citations validated against real timestamps, errors logged server-side only.
- `/api/collections`: ownership taken from `auth()` and never from the body; a write that
  targets a collection whose `owner` is not the caller is a 403; a document with no `owner`
  is never writable through the route.
- `/api/progress`: the two new fields get explicit Zod bounds (`quizScore` 0–100 integer).
- Quiz answers ship to the browser inside the lesson payload — this is a learning aid, not
  an exam, so client-side grading is deliberate and noted in the code.

## Acceptance criteria

1. No orange, no Playfair, no hatch, no 1440 frame anywhere in the app.
2. The theme toggle switches instantly, survives reload, defaults to the OS setting, and
   produces no flash of the wrong theme on a hard refresh.
3. `/design-system` documents every token, primitive and state in both themes.
4. The lesson page shows a transcript that filters and seeks the playing video.
5. Asking a question about a lesson returns an answer whose every timestamp chip seeks to a
   real moment in that lesson; a question the lesson does not cover says so instead of
   inventing an answer.
6. A lesson with an ingested quiz can be taken, graded, and its score shows on `/my-learning`.
7. A streak count appears once a learner has activity on two consecutive days.
8. A learner can save lessons to a collection, see it at `/collections`, and cannot read or
   write anyone else's.
9. Signed-out browsing still works everywhere except `/my-learning` and personal collections.

## Checks

Per phase, from the repo root unless stated:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (phases 2–6 — routes, config or server modules change)
- `npm run check:rank`, `check:video`, `check:ingest`, `check:keyword`, `check:progress`
- New: `npm run check:quiz`, `npm run check:streak`, `npm run check:lesson-qa`
- Phase 4: one live call against the real model + a lesson that has ingested chunks.
- Phase 5: `node studio/scripts/quizzes/generate.mjs` against one real video, then
  `npx sanity dataset import` from `studio/`.
- Phases 5–6 change the schema: `npx sanity schema deploy` and `npx sanity deploy` from
  `studio/` (§12 — the Context MCP needs the deployed Studio app).

## Manual test steps

1. `npm run dev`, open `/`. Toggle the theme; hard-refresh — the theme holds, no flash.
2. Set the OS to dark with no stored preference — the app opens dark.
3. Walk `/` → `/courses` → a course → a lesson at 375px and at 1440px. Nothing overflows,
   the lesson rail collapses, the course tree becomes a disclosure.
4. On a lesson, open the Transcript tab, type a word, click a line — the video plays from
   that second and the line highlights.
5. Ask the lesson a question it covers; click a timestamp chip. Then ask something it does
   not cover and confirm it declines instead of guessing.
6. Take a quiz, get one wrong, use "watch that moment", finish; the score appears on
   `/my-learning`.
7. Save two lessons to a new collection; open `/collections`; sign out and confirm the
   personal view redirects to sign-in while a curated path stays public.
8. Search a query, confirm the count, the sort control and both card kinds render in the
   new language and still deep-link with `?t=`.
9. PostHog live events: confirm the five new events and that the existing ones still fire.
