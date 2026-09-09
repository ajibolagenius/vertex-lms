# PostHog analytics for the shipped features

## Goal

Instrument the engagement moments AGENTS §7 calls for, across the features built since the
basic PostHog setup: search, search-result clicks, video playback and watch depth, resume,
and lesson completion. Server-side where the action is server-side. No PII beyond the Clerk
user id.

## Skills / docs read

- `AGENTS.md` §5 (boundaries), §7 (PostHog decisions), §12 (key handling), §13 (checks).
- PostHog Next.js conventions: `snake_case` `object_verb` event names, `snake_case`
  properties, `posthog-js` for browser actions, `posthog-node` for server actions,
  `instrumentation-client.ts` for init (already in place, do not add a provider).
- `prompts/posthog-session-replay.md` (existing setup, masking floor, identify).

## Code inspected

- `instrumentation-client.ts` — init, `defaults: "2026-01-30"` (autocapture `$pageview` /
  `$pageleave` including App Router history changes), replay masking.
- `lib/posthog-server.ts` — `getPostHogClient()`, `flushAt: 1`, returns `null` with no token.
- `components/posthog-identify.tsx` — `posthog.identify(clerkUserId)`, id only.
- Existing captures: `explore_courses_clicked`, `search_initiated`, `course_viewed`,
  `course_bookmarked`, `course_started`, `lesson_viewed`, `lesson_completed`,
  `notification_bell_clicked`, `sign_in_clicked`, `sign_up_clicked`, `video_played`
  (client), `search_performed` (server, in `app/api/search/route.ts`).
- `components/lesson/video-player.tsx` — click-to-load facade; nothing from YouTube loads
  until play. No provider API attached, so there is currently no playback signal at all.
- `components/search/{search-results,result-card}.tsx` — `ResultCard` has no `"use client"`
  but is imported by a client component, so it is already in the client bundle.
- `app/my-learning/page.tsx` — server component; the "Continue: …" link is the only real
  resume affordance (its href carries `?t=`). The course page's "Continue Learning" always
  points at the first lesson (progress-aware resume is not wired there).
- `components/course-actions.tsx` — `LessonViewTracker` already reads `?t=` via
  `startSecondsFrom`; `MarkCompleteButton` toggles completion through `/api/progress`.
- `app/courses/page.tsx` — the catalog. **No tracking at all today**, though §7 names
  "catalog … views" explicitly.

## Decisions and assumptions

1. **Keep existing event names.** They already follow `object_verb` snake_case. Enrich
   properties rather than rename, so no PostHog insight breaks.
2. **`search_performed` stays server-side** — the search work happens in the route, and
   the route is the only place that knows `source` (agent vs keyword fallback) and the real
   result count. It already captures `query`. Add `has_results`.
3. **`search_result_opened` is client-side** — it is a click. Fired from `ResultCard`,
   which needs the current `query` passed down from `SearchResults`.
4. **`lesson_completed` stays client-side.** The click is the action; `/api/progress` is
   persistence. The client is also the only side that knows the slug, course and module.
   Trade-off noted: ad-blocked clients drop it. (Alternative — capture in the route from
   `lessonId` — loses that context and would double-count.)
5. **Watch depth needs the YouTube IFrame API.** The player is a facade, so the API script
   loads only *after* the learner presses play — a non-watcher pays nothing. Milestones at
   25 / 50 / 75 / 100 %, each fired at most once per mount, polled on a 5s interval.
   Requires `enablejsapi=1` on the embed URL. `youtube-nocookie.com` supports the JS API.
6. **Resume**: `learning_resumed` on the My Learning continue link (`source: "my_learning"`),
   plus `resumed_from_seconds` on `lesson_viewed` when `?t=` is present, which covers a
   resume that arrives from a search deep link too.
7. **No `lib/analytics.ts` wrapper.** One indirection for ~15 call sites of
   `posthog.capture` earns nothing; existing code calls `posthog.capture` directly.
8. **PII**: only the Clerk user id (already the distinct id). Properties carry slugs,
   titles, counts and enums. The search `query` is learner-typed text and is already
   captured today — it is the analytical point of a search event and is not personal
   identity data; it stays.

## Event catalogue after this change

| Event | Side | Properties |
|---|---|---|
| `catalog_viewed` | client | `course_count` |
| `course_viewed` | client | existing + `course_slug`, `course_title`, `course_level` |
| `lesson_viewed` | client | existing + `resumed_from_seconds` (0 when not a resume) |
| `search_initiated` | client | `query`, `query_length`, `source` (`home` \| `results`) |
| `search_performed` | **server** | existing + `has_results` |
| `search_result_opened` | client | `query`, `result_type`, `rank`, `lesson_slug`, `course_slug`, `start_seconds` |
| `search_sort_changed` | client | `query`, `sort` |
| `video_played` | client | existing + `course_slug`, `resumed` |
| `video_watch_progress` | client | `lesson_slug`, `course_slug`, `percent` (25/50/75/100), `position_seconds`, `duration_seconds` |
| `lesson_completed` | client | existing + `course_slug`, `module_index` |
| `lesson_uncompleted` | client | `lesson_slug` |
| `learning_resumed` | client | `course_slug`, `lesson_slug`, `position_seconds`, `source` |
| `my_learning_viewed` | client | `course_count` |

Untouched: `explore_courses_clicked`, `course_bookmarked`, `course_started`,
`notification_bell_clicked`, `sign_in_clicked`, `sign_up_clicked`.

## Files expected to change

- `components/lesson/video-player.tsx` — `enablejsapi=1`, YT IFrame API loaded on play,
  watch-depth milestones, richer `video_played`. Takes a new `courseSlug` prop.
- `app/lessons/[slug]/page.tsx` — pass `courseSlug` to `LessonVideo`, `moduleIndex` to
  `MarkCompleteButton`.
- `components/course-actions.tsx` — `resumed_from_seconds` on `lesson_viewed`; course/module
  props on `lesson_completed`; `lesson_uncompleted`.
- `components/search/search-form.tsx` — `query_length` + `source` on `search_initiated`.
- `components/search/search-results.tsx` — pass `query` to `ResultCard`;
  `search_sort_changed`.
- `components/search/result-card.tsx` — `"use client"` + `search_result_opened` on click.
- `app/api/search/route.ts` — `has_results` property.
- `app/courses/page.tsx` + a small client tracker — `catalog_viewed`.
- `app/my-learning/page.tsx` + a small client component — `my_learning_viewed`,
  `learning_resumed` on the continue link.
- `lib/video.ts` — `youtubeEmbedUrl` gains `enablejsapi=1`.

New file: `components/analytics/view-tracker.tsx` — one `"use client"` fire-once-on-mount
tracker reused by the catalog and My Learning (both are server components). Reuses the
pattern already in `CourseViewTracker`/`LessonViewTracker` rather than adding two more
bespoke components.

## Requirements

- No new dependency. `posthog-js` and `posthog-node` are already installed.
- Server captures go through `getPostHogClient()`, which no-ops without a token.
- The browser keeps only `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`. No env change; `.env.example`
  is already correct.
- Server/client boundary unchanged: no new fetches, no token in the browser.
- Every milestone fires at most once per player mount; the poll interval is cleared on
  unmount and when the video ends.
- Visuals unchanged. `ResultCard` gaining `"use client"` must not alter markup.

## Security considerations

- No PII beyond the Clerk user id, which is already the distinct id. No name, email or
  Clerk session token in any property.
- The YouTube IFrame API script is loaded from `https://www.youtube.com/iframe_api` — the
  provider's own documented endpoint, only after an explicit play click.
- Replay masking in `instrumentation-client.ts` is untouched.
- No secret reaches the browser; the search route's PostHog call remains server-side.

## Acceptance criteria

1. Searching from home and from the results page fires `search_initiated`, then one
   server-side `search_performed` carrying `query`, `source`, `result_count`, `has_results`.
2. Clicking a result fires `search_result_opened` with `result_type` `video` or `lesson`.
3. Pressing play fires `video_played`; watching fires `video_watch_progress` at 25/50/75/100
   with no duplicates.
4. Continuing from My Learning fires `learning_resumed`; the landing lesson's
   `lesson_viewed` carries a non-zero `resumed_from_seconds`.
5. Marking complete fires `lesson_completed` with `course_slug` and `module_index`;
   un-marking fires `lesson_uncompleted`.
6. `/courses` fires `catalog_viewed`; `/my-learning` fires `my_learning_viewed`.
7. No event property contains a name, email or any Clerk value other than the user id.

## Checks to run

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (routes and server code change)
- `npm run dev` and walk the manual steps below with the PostHog debug console open
  (`debug: true` is already on in development).

## Manual test steps

1. `npm run dev`, open `http://localhost:3000`, sign in.
2. Search "data fetching" from the hero → console shows `search_initiated`
   (`source: "home"`).
3. On `/search`, confirm results, then change the sort → `search_sort_changed`.
4. Click a **Video** card → `search_result_opened` with `result_type: "video"` and a
   `start_seconds`. Click a **Lesson** card from a fresh search → `result_type: "lesson"`.
5. On the lesson page, press play → `video_played` (`resumed: true` if the URL had `?t=`).
   Let it run / scrub past a quarter → `video_watch_progress` `percent: 25`, then 50.
   Confirm 25 does not repeat.
6. Press "Mark as complete" → `lesson_completed`. Press again → `lesson_uncompleted`.
7. Open `/my-learning` → `my_learning_viewed`. Click "Continue: …" → `learning_resumed`,
   then `lesson_viewed` with `resumed_from_seconds > 0`.
8. Open `/courses` → `catalog_viewed` with `course_count`.
9. In the PostHog project, confirm `search_performed` arrives with the Clerk user id as
   distinct id and no PII in its properties.
