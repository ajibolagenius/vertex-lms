# Save the real playback position as resume progress

## Goal

`progress.positionSeconds` should be where the learner actually stopped watching, not the
`?t=` second they arrived on. My Learning's "Continue: …" link already reads that field and
appends it as `?t=`, so fixing the write end is enough to make resume real.

## Skills / docs read

- `AGENTS.md` §5 (the browser never writes content or progress — everything goes through a
  server route), §7 (progress is per learner, keyed off the Clerk user id, surfaced as a
  resume affordance), §13 (checks).
- No new skill needed; this is the write path built in `prompts/my-learning.md` plus the
  IFrame API attached in `prompts/posthog-feature-analytics.md`.

## Code inspected

- `components/lesson/video-player.tsx` — since the analytics change it attaches the YouTube
  IFrame API on play and already polls `getCurrentTime()` / `getDuration()` every 5s for
  watch-depth milestones. That poll is the playback signal; nothing else has one.
- `components/course-actions.tsx` `LessonViewTracker` — on mount it calls
  `saveProgress({ lessonId, positionSeconds: startSeconds })`, where `startSeconds` is
  `?t=` or **0**.
- `app/api/progress/route.ts` — `createIfNotExists` + `set` per (learner, lesson).
  `ProgressWriteSchema` currently `.refine`s that at least one of `completed` /
  `positionSeconds` is present.
- `lib/progress.ts` `groupByCourse` — resume = newest incomplete record, href carries
  `?t=positionSeconds` when > 0. Already correct; no change needed.
- `lib/progress-client.ts` `saveProgress` — plain `fetch`, returns a boolean, swallows
  failures.

## The bug this also fixes

Opening a lesson **without** `?t=` writes `positionSeconds: 0`. So a learner 6 minutes into
a lesson who clicks it again from the sidebar has their resume position wiped back to the
start. Every caller routes through `LessonViewTracker`, so the fix is one place.

## Decisions and assumptions

1. **The mount write becomes a touch, with no position at all.** Opening a lesson records
   *that* it was started (so it appears on My Learning); *where* the learner is comes only
   from real playback. This kills the reset-to-0 bug and also stops a search deep link the
   learner never watched from being recorded as their resume point.
   - Requires relaxing `ProgressWriteSchema` to accept `{ lessonId }` alone. That write is
     still `createIfNotExists` + `set updatedAt`, so it stays safe: no field is cleared,
     and the strong reference still proves `lessonId` is a real lesson.
2. **Position saves ride the existing 5s poll** — no second timer, no new API surface. A
   write goes out only when the position has moved at least `SAVE_EVERY_SECONDS` (15) from
   the last saved value. Worst case the stored position is ~15s stale, which resumes the
   learner slightly early — the right direction to be wrong in.
3. **No `pagehide` beacon.** With a 15s ceiling on staleness it buys nothing, and a
   `keepalive` write racing an unmount is a failure mode I'd rather not own.
4. **Only for signed-in learners.** `useAuth().isSignedIn` gates it, so an anonymous
   viewer does not fire POSTs that can only 401.
5. **Read side unchanged.** My Learning already resumes through `?t=`. Auto-resuming a
   direct lesson visit from the stored position would mean fetching `/api/progress` before
   the embed can be built, and `?t=` from search would have to keep winning — a separate
   change, not this one.
6. **No auto-complete at ~95%.** Completion stays explicit (AGENTS §7).
7. **No analytics change.** `video_watch_progress` already reports `position_seconds`.

## Files expected to change

- `components/lesson/video-player.tsx` — new `lessonId` prop, `useAuth`, a
  `lastSavedSeconds` ref, and the throttled `saveProgress` call inside the existing poll.
- `app/lessons/[slug]/page.tsx` — pass `lessonId={lesson._id}` to `LessonVideo`.
- `components/course-actions.tsx` — `LessonViewTracker` writes `saveProgress({ lessonId })`;
  `startSeconds` stays, still used for the `resumed_from_seconds` property.
- `app/api/progress/route.ts` — drop the `.refine`, documenting the bare touch write.

No new file, no new dependency, no env change.

## Requirements

- The browser still never writes to Sanity; every write goes through `/api/progress`, and
  the learner is taken from Clerk's server-side `auth()`.
- Position is a whole number of seconds, clamped by the route's existing
  `min(0).max(86_400)`.
- The poll interval keeps its existing behaviour: one interval, cleared on cleanup and once
  the 100% milestone has fired.
- Saving must not throw into the render path — `saveProgress` already swallows failures.
- Visuals unchanged.

## Security considerations

- Unchanged trust boundary: `lessonId` is still validated against `SANITY_ID` and the
  strong reference; `userId` is never read from the request body.
- Relaxing the schema widens the accepted body to `{ lessonId }` only. That write sets
  `updatedAt` and nothing else, so it cannot clear `completed` or `positionSeconds`, and it
  cannot address another learner's document.
- No token reaches the browser; no new property carries PII.

## Acceptance criteria

1. Watching a lesson for ~20s then leaving stores a `positionSeconds` within ~15s of where
   playback stopped.
2. My Learning's "Continue: …" for that course links to `/lessons/<slug>?t=<that second>`,
   and the embed starts there.
3. Re-opening a partly-watched lesson **without** `?t=` no longer resets the stored
   position to 0.
4. Pausing does not generate repeat writes (the position stops moving).
5. An anonymous viewer generates no `/api/progress` POSTs.
6. `POST /api/progress` with `{ lessonId }` alone returns 200 and leaves `completed` and
   `positionSeconds` untouched.

## Checks to run

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (a route and server code change)
- `npm run check:progress` (grouping/resume unaffected — confirm it still passes)
- `npm run dev` and the manual steps below.

## Manual test steps

1. `npm run dev`, sign in, open a lesson you have not watched.
2. Press play, let it run ~25s (Network tab: one `POST /api/progress` after ~15s of
   playback, not one every 5s), then navigate away.
3. Open `/my-learning` → "Continue: <that lesson>" links to `?t=` ≈ where you stopped.
4. Click it → the embed starts at that second.
5. Now open the same lesson from the course sidebar (no `?t=`), do not press play, leave.
   Return to `/my-learning` → the resume second is **unchanged**, not 0.
6. Sign out, open a lesson, press play → no `/api/progress` requests in the Network tab.
7. `curl -X POST localhost:3000/api/progress -H 'content-type: application/json' -d '{"lessonId":"<id>"}'`
   with a signed-in session cookie → `{"ok":true}`.
