# PostHog Session Replay + Replay Vision

## Goal

Make Vertex produce **usable, privacy-safe session recordings**, and set up the
**Replay Vision** scanners that watch those recordings — the two monitors the earlier
self-driving run (`posthog-self-driving-report.md`) deferred because no recordings existed.

## Skills / docs read

- `AGENTS.md` §5 (boundaries), §7 (PostHog decisions), §12 (key handling), §13 (checks).
- `node_modules/@posthog/types/dist/posthog-config.d.ts` — `SessionRecordingOptions`,
  `rageclick`, `capture_dead_clicks`, `ConfigDefaults` (`'2026-01-30'`).
- `posthog-self-driving-report.md` — what is already enabled PostHog-side and what is deferred.

## Code inspected

| File | State today |
| --- | --- |
| `instrumentation-client.ts` | `posthog.init` with `api_host: "/ingest"`, `defaults: "2026-01-30"`, `capture_exceptions: true`. No `session_recording` block, no dead-click capture. Recording is on purely by project remote config. |
| `next.config.ts` | `/ingest` reverse proxy to `eu-assets.i.posthog.com` + `eu.i.posthog.com`, `skipTrailingSlashRedirect`. Replay's recorder script already loads through it. |
| `lib/posthog-server.ts` | `posthog-node` singleton, server-only. Untouched by this work. |
| `components/{home-cta,course-actions,nav/header-actions}.tsx` | Client `posthog.capture` calls: `explore_courses_clicked`, `search_initiated`, `course_viewed`, `course_bookmarked`, `course_started`, `notification_bell_clicked`, `sign_in_clicked`, `sign_up_clicked`. |
| `app/layout.tsx` | `ClerkProvider` wraps children. No PostHog identify — recordings are anonymous today. |
| `.env.example` | **Missing** `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`, although `.env.local` has both. |
| MCP | No PostHog MCP server is connected in this session (`claude mcp list`). Replay Vision monitors cannot be created from here. |

## Decisions and assumptions

1. **Recording stays enabled by project config.** `posthog-js` records unless
   `disable_session_recording` is set; the project toggle is already on. No `sampleRate`
   in code — sampling stays a dashboard decision, so it can change without a deploy.
2. **Masking is set in code, not only in the dashboard.** An init-level masking option
   wins over the project "Privacy and masking" setting, so the privacy floor travels with
   the repo. Inputs stay masked (the default) and Clerk's account popover text is masked
   by selector — that is where the learner's name and email render.
3. **Dead clicks on, rage clicks already on.** `rageclick` defaults to `true`; dead clicks
   default off. The deferred Replay Vision *user-frustration* monitor keys off both, so
   enable `capture_dead_clicks`.
4. **Identify with the Clerk user id only.** No email, no name into PostHog — the id is
   enough to pull "this learner's sessions", and it keeps PII out of the analytics store.
   `posthog.reset()` on sign-out so a shared browser does not merge two learners.
5. **No network body/header capture.** `recordBody`/`recordHeaders` stay off; our requests
   carry Clerk session cookies and Sanity-backed payloads.
6. **Replay Vision is PostHog-side.** Scanners are created in PostHog (UI or PostHog MCP),
   not in this repo. This prompt delivers the two monitor briefs in exact, paste-ready form
   and updates the report; creating them needs either the PostHog MCP connected or a manual
   paste. Nothing about them lands in application code.
7. Provider video embeds (YouTube/Vimeo/Bunny, §9) are cross-origin iframes and will show
   as blank rectangles in replays. `recordCrossOriginIframes` cannot fix that (we do not
   control the frame). Documented, not worked around.

## Files expected to change

- `instrumentation-client.ts` — add `session_recording` masking block + `capture_dead_clicks`.
- `components/posthog-identify.tsx` — **new**, ~20-line client component, Clerk id → `posthog.identify` / `posthog.reset`.
- `app/layout.tsx` — mount it inside `ClerkProvider`.
- `.env.example` — add the two PostHog vars with a note that the project token is public by design.
- `posthog-self-driving-report.md` — tick the follow-ups this closes, record the two monitor briefs.

## Requirements

- Recording works in dev and production through the `/ingest` proxy with no new env var.
- Every `<input>` value is masked in the recording, including the Clerk sign-in and sign-up forms.
- The learner's name/email in the Clerk account popover is masked in the recording.
- A signed-in session's recording is attributed to the Clerk user id; signing out resets it.
- Rage clicks and dead clicks are captured so the frustration monitor has a signal.
- No behaviour change to any existing `posthog.capture` call.

## Security considerations (AGENTS §12)

- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is public by design and is the only PostHog credential
  in the browser. Any private PostHog API key stays server-side; none is added here.
- No Clerk secret, Sanity read token, or write token is touched. Identify runs in the browser
  with the Clerk user id, which the browser already holds.
- Masking defaults are fail-closed: `maskAllInputs: true` is stated explicitly rather than
  inherited, so a dashboard change cannot silently start recording typed text.
- Network request bodies and headers are not recorded.

## Acceptance criteria

1. `instrumentation-client.ts` sets `session_recording.maskAllInputs: true`, a
   `maskTextSelector` covering Clerk's user preview/popover, and `capture_dead_clicks: true`.
2. Visiting the site signed out produces a recording in PostHog → Session replay.
3. Typing into the sign-in form shows `*` (or blocks) in the replay, never the real characters.
4. A signed-in session's recording lists the Clerk user id as the person.
5. Signing out and signing in as another user produces two distinct persons, not one merged.
6. `.env.example` lists both PostHog variables.
7. `posthog-self-driving-report.md` carries the two Replay Vision monitor briefs and the
   updated follow-up list.

## Checks to run (AGENTS §13, web workspace)

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (client instrumentation + layout changed)
- `npm run dev` and exercise the manual steps below

## Manual test steps

1. `npm run dev`, open `http://localhost:3000`, click **Explore Courses**, open a course.
2. In the browser console: `posthog.sessionRecordingStarted()` → expect `true`.
   Confirm requests to `/ingest/s/` in the Network tab (that is the replay ingest path).
3. Open `/sign-in`, type a fake email and password, then sign in.
4. In PostHog → Session replay (EU project 266997), open the newest recording.
   - The typed email and password render masked.
   - The account popover name/email render masked.
   - The recording's person is the Clerk user id, and events
     (`course_viewed`, `explore_courses_clicked`) appear on its timeline.
5. Sign out, sign in as a second user, confirm a second distinct person.
6. Click a non-interactive element five times fast → a `$rageclick` / `$dead_click` event
   appears on the recording timeline.

## Replay Vision monitor briefs (PostHog-side, not code)

Deliver these in the report so they can be created in PostHog once recordings exist.
Both stay narrow and non-overlapping, per the deferred plan.

**1. Breakage monitor**
- Scope: sessions touching `/`, `/courses`, `/courses/*`.
- Watch for: a page rendering with no course cards, a click on Explore Courses / Continue
  Learning that does not navigate, a Sanity-empty state where content is expected,
  and any visible error boundary.
- Sampling: 1% of matching sessions. Model: Gemini 3.5 Flash Lite.

**2. User-frustration monitor**
- Scope: same URLs, restricted to sessions containing `$rageclick` or `$dead_click`.
- Watch for: repeated clicks on the read-only hero search input, repeated clicks on the
  notifications bell (presentational, AGENTS §7), and back-and-forth navigation between a
  course page and the catalog without starting a lesson.
- Sampling: 1% of matching sessions. Model: Gemini 3.5 Flash Lite.

Creating them needs the PostHog MCP connected (with `property_definition:read`) or a manual
paste into PostHog → Replay Vision. Quota noted in the report: 2,500 credits remaining.

## Out of scope

- Search-result, video-playback and lesson-completion events (those flows do not exist yet).
- Any change to the server-side PostHog client, or any new server route.
- Turning on Replay Vision scanners from this session — no PostHog MCP is connected.
