# My Learning page + learner progress

## Goal

Make `/my-learning` real: show the signed-in learner the courses they have started, how far
through each one they are, and a link that resumes the lesson they last opened. The page needs
a progress record to read, and something has to write it, so this change covers the whole
minimal loop: schema, write route, read query, page.

UI is deliberately plain — there is no reference image in `design/` for this page, and the user
asked for simple. Reuse the existing frame (`SiteHeader`, `Card`, `ProgressBar`) and add no new
visual vocabulary.

## Skills / docs read

- `AGENTS.md` §5 (boundaries), §7 (Clerk-keyed progress, presentational surfaces, PostHog events),
  §8 (progress record), §12 (server-only tokens), §13 (checks).
- Existing code inspected: `proxy.ts`, `sanity/lib/{client,fetch,queries}.ts`,
  `app/{courses,lessons}/**`, `components/course-actions.tsx`, `components/ui/progress-bar.tsx`,
  `components/nav/site-header.tsx`, `studio/schemaTypes/**`, `studio/scripts/context/vertex-search.ndjson`,
  `.env.example`.

## Decisions and assumptions

1. **One `progress` document per (learner, lesson)**, `_id: progress.<clerkUserId>.<lessonId>`.
   A single per-user document holding an array would need keyed-array patching and loses on
   concurrent writes; a deterministic id makes every write a `createIfNotExists` + `patch.set`
   transaction with no read-modify-write. Reads filter on `userId`.
2. **Progress lives in Sanity but apart from content** (§8): its own document type, `readOnly` in
   the Studio, written only by the server route with `SANITY_API_WRITE_TOKEN`. The Context
   document's `groqFilter` is a type whitelist, so the search agent never sees it — no change needed
   there.
3. **Resume position is lesson-level, not second-level.** The player is a click-to-load facade
   iframe with no YouTube IFrame API, so real playback time is not observable without loading the
   API on every lesson. Opening a lesson records it as the last position (seconds = the `?t=` deep
   link, else 0). Marked with a `ponytail:` comment naming the upgrade path.
4. **Completion is explicit**: a "Mark as complete" button on the lesson page. No watch-percentage
   heuristic.
5. **Course and lesson pages stay static.** Wiring per-user progress into them would make two
   prerendered routes dynamic; that is a separate call. The lesson sidebar's `completedLessonIds`
   and the course page's `percentComplete` keep their current placeholder values. Called out in the
   report.
6. `GET /api/progress` returns the caller's own records so the client-side complete button can show
   correct state on a statically rendered lesson page.
7. Progress reads bypass the CDN and the fetch cache (`fresh: true, revalidate: 0`) — a learner must
   see their own write immediately, and a 60s shared cache entry on per-user data is wrong.

## Files

New:
- `studio/schemaTypes/documents/progress.ts` — the document type.
- `sanity/lib/write-client.ts` — `server-only`, write token, `useCdn: false`.
- `app/api/progress/route.ts` — `GET` (own records) and `POST` (upsert one lesson).
- `app/my-learning/page.tsx` — the page.
- `lib/progress.ts` — pure grouping/percent/resume logic shared by the page.
- `lib/progress.check.mjs` — assert-based self-check for that logic.

Changed:
- `studio/schemaTypes/index.ts` — register `progress`.
- `sanity/lib/queries.ts` — `PROGRESS_BY_USER_QUERY`.
- `components/course-actions.tsx` — `LessonViewTracker` also records the visit; new
  `MarkCompleteButton`.
- `app/lessons/[slug]/page.tsx` — render the button in the lesson nav.
- `.env.example` — `SANITY_API_WRITE_TOKEN`.
- `package.json` — `check:progress` script.

## Requirements

- Schema `progress`: `userId` (string, required), `lesson` (reference to lesson, required),
  `completed` (boolean), `positionSeconds` (number, integer, min 0), `updatedAt` (datetime).
  `readOnly: true` — app state, not authored content.
- `POST /api/progress`: Clerk `auth()`; 401 when signed out. Zod body
  `{ lessonId: string, completed?: boolean, positionSeconds?: int >= 0 }`, `lessonId` constrained to
  Sanity's id charset so it cannot smuggle anything into the document id. Writes only the fields
  sent, plus `updatedAt`. The strong reference means a bogus `lessonId` is rejected by the API.
- `GET /api/progress`: the caller's own records only, keyed off `auth()`, never a query param.
- Page: `auth()` → `redirect('/sign-in')` if somehow unauthenticated (`proxy.ts` already gates it).
  Group records by course, sort courses by most recently touched, show title, "n of m lessons",
  a `ProgressBar`, and a Continue link to the most recently touched unfinished lesson (with `?t=`
  when a position is stored). Empty state links to `/courses`.
- PostHog: capture `lesson_completed` on the complete action (§7 lists it; nothing captures it today).

## Security

- Write token is server-only, read from `process.env.SANITY_API_WRITE_TOKEN` inside a `server-only`
  module, never exposed and never used outside the route.
- Both verbs derive the user from Clerk's server-side `auth()`. No user id is ever accepted from the
  client, so one learner cannot read or write another's record.
- The browser never talks to Sanity — it calls `/api/progress` only.
- Request body validated with Zod before anything reaches the datastore.

## Acceptance criteria

1. Signed out, `/my-learning` bounces to sign-in (existing `proxy.ts` behaviour).
2. Signed in with no history, `/my-learning` shows the empty state and a link to the catalog.
3. Opening a lesson while signed in creates a progress record; `/my-learning` then lists that
   course with a Continue link back to the lesson.
4. "Mark as complete" flips the lesson to complete, survives a reload, and moves the course's
   percentage.
5. A course with every lesson complete reads 100% and offers no Continue link.
6. `/api/progress` returns 401 signed out for both verbs.
7. Courses, lessons and search are untouched and still prerender.

## Checks

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (new route + new API route)
- `npm run check:progress` (the new self-check)
- `npm --prefix studio run deploy` / schema deploy — needed because the schema gained a type.

## Manual test

1. `npm run dev`, sign in.
2. Visit `/my-learning` → empty state.
3. Open any lesson, then reload `/my-learning` → the course appears at 0% with Continue.
4. Back on the lesson, press "Mark as complete", reload → button reads complete; `/my-learning`
   shows 1 of n and the percentage moved.
5. Complete every lesson in one module-light course → 100%, no Continue link.
6. Sign out, hit `/my-learning` → redirected to sign-in. `curl -i localhost:3000/api/progress` → 401.
