# PostHog Self-driving setup report

## Summary

PostHog Self-driving was configured for Vertex with Error Tracking and Support enabled; Session Replay was already enabled. Native health, error, and support responders are active, and a selective five-scout troop includes one custom learning-journey liveness scout.

The app is a Next.js learning platform using `posthog-js` and `posthog-node`. Its browser initialization keeps exception capture enabled and does not disable Session Replay. Findings should start appearing in the [Self-driving inbox](https://eu.posthog.com/project/266997/inbox) within about 30 minutes.

## AI data processing

Approved.

## GitHub

The PostHog GitHub App was already connected before this setup. No GitHub Issues warehouse source was created because connected tools were declined in this run.

## Products enabled

| Product | Result | Notes |
| --- | --- | --- |
| Session Replay | already enabled | Web client initialization check was clean: no recording disable override is present. No recordings were available at setup time. |
| Error Tracking | enabled | Browser initialization already has exception capture enabled. |
| Support | enabled | Tickets will arrive only after an inbound Support channel (email, inbox, or Slack) is connected in PostHog. |

## Signal sources

| source_product | source_type | Action | Notes |
| --- | --- | --- | --- |
| signals_scout | cross_source_issue | already enabled by platform default | No config row is needed unless opting out. |
| health_checks | health_issue | enabled | Config `01a07559-5c50-7ecc-9afe-2e6c83e8fa74`. |
| error_tracking | issue_created | enabled | Config `01a07559-5d89-7eac-b523-f83307f1563d`. |
| error_tracking | issue_reopened | enabled | Config `01a07559-5d0a-7490-b74a-d7e8a4050c8b`. |
| error_tracking | issue_spiking | enabled | Config `01a07559-5c5d-7426-a361-8b19edec7c50`. |
| conversations | ticket | enabled | Config `01a07559-5ce5-744b-9cd5-bd24aa7c890d`; dormant until an inbound channel exists. |
| session_replay | session_analysis_cluster | skipped | Retired responder; Replay Vision scanners are the supported route. |
| replay_vision | scanner_finding | deferred | Scanners self-authorize through `emits_signals`; no source config row was created. |

## Connected tools

No connected tools were selected. The external data warehouse inventory had no sources, and no connected-tool responders were created.

## Scout troop

**Run budget:** 100 maximum runs per day; 0 used today; 100 remaining. Announcement: “Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.”

### Active scouts

| Scout | Why it is active |
| --- | --- |
| `signals-scout-general` | Watches cross-product patterns and otherwise-uncovered surfaces. |
| `signals-scout-product-analytics` | Watches behavioral-flow conversion, retention, and lifecycle regressions. |
| `signals-scout-web-analytics` | Watches website traffic, attribution, landing pages, bounce, and 404 changes. |
| `signals-scout-observability-gaps` | Recommends insight and alert coverage for significant events. |
| `signals-scout-learning-journey-liveness` | Custom scout for learner discovery and course-start volume failures. |

### Disabled scouts

| Scout | Reason |
| --- | --- |
| `signals-scout-ai-observability` | No active AI observability evidence was found. |
| `signals-scout-anomaly-detection` | No established dashboard or insight estate was found to monitor. |
| `signals-scout-apm` | No APM or tracing surface was found. |
| `signals-scout-conversations` | Support is routed through the native ticket responder. |
| `signals-scout-csp-violations` | No CSP-reporting integration was found. |
| `signals-scout-customer-analytics` | No account or group analytics surface was found. |
| `signals-scout-data-pipelines` | No CDP destination, batch export, or Hog Flow surface was found. |
| `signals-scout-data-warehouse` | No warehouse sources are connected. |
| `signals-scout-error-tracking` | Covered by the native Error Tracking responder. |
| `signals-scout-experiments` | No active experiment surface was found. |
| `signals-scout-feature-flags` | No active feature-flag surface was found. |
| `signals-scout-health-checks` | Native health responder already reaches the inbox. |
| `signals-scout-inbox-validation` | Fresh inbox; no resolved reports exist to validate yet. |
| `signals-scout-insight-alerts` | No insight-alert surface was found. |
| `signals-scout-logs` | No PostHog Logs surface was found. |
| `signals-scout-mcp-tool-calls` | No product MCP tool telemetry surface was identified. |
| `signals-scout-replay-vision` | No accumulated Replay Vision observations exist yet. |
| `signals-scout-revenue-analytics` | No payment or revenue data surface was found. |
| `signals-scout-session-replay` | Covered by Replay Vision scanners once configured. |
| `signals-scout-skills-store` | No project skills-store hygiene use case was identified. |
| `signals-scout-surveys` | No surveys exist in the project. |
| `signals-scout-tasks` | No PostHog Tasks surface was found. |
| `signals-scout-web-vitals` | Web Vitals collection was not confirmed. |

## Custom scouts

| Scout | What it watches | Discriminator and coverage rationale |
| --- | --- | --- |
| `signals-scout-learning-journey-liveness` | Learner course exploration, search initiation, course views, and course starts. | It compares absolute, weekday-matched journey volume to the platform’s own completed baseline. It catches sustained entry or start-volume drops, including cases where conversion rates appear stable; the built-in product-analytics scout focuses on derived-rate regressions with a steady denominator. |

The proposal was approved. Considered but ruled out: a search-result quality scout, because current instrumentation only records search initiation and has no result, success, or failure event pair. The scout’s noise escape hatch is setting `emit: false` in its PostHog configuration to make it dry-run only.

## Replay Vision scanners

A Replay Vision scanner is an LLM that watches individual session recordings on a schedule and pushes observed defects to the inbox. It is the only part of this setup that consumes Replay Vision quota; findings arrive at half weight and require independent corroboration before promotion to an inbox report.

| Required monitor | Status | Notes |
| --- | --- | --- |
| Breakage monitor | **created** | Live as "Course page breakage" (`01a07578-6e50-7cfb-baa0-5d45e4a8341f`). |
| User-frustration monitor | **created** | Live as "Course learning frustration" (`01a07576-7768-7b0d-9e07-4e2c67c0e6ef`). |

Both were created through the PostHog MCP after it was authenticated, along with a third
Summarizer, "Vertex learner session summaries". See `posthog-replay-vision-report.md` for
the live IDs, triggers and sampling as configured. The as-built scanners diverge from the
configs below: they run `gemini-3-flash-preview` rather than Flash Lite, the frustration
monitor is triggered site-wide on `$rageclick` rather than URL-scoped, and sampling is
higher (1.0 and 0.5). Treat the tables below as the original intent and the sibling report
as the source of truth; revisit sampling and model once real traffic shows the credit burn.

The PostHog MCP server was added at user scope on 2026-09-06
(`claude mcp add --transport http posthog https://mcp.posthog.com/mcp -s user`).

Both stay narrow and non-overlapping, per the deferred plan. Fields follow
[Creating scanners](https://posthog.com/docs/replay-vision/creating-scanners).

### Breakage monitor

| Field | Value |
| --- | --- |
| Name | Vertex — catalog and course breakage |
| Scanner type | Monitor |
| Prompt | Watch for the learner hitting a broken surface. Flag: a catalog or course page that renders with no course cards where content is expected; a click on **Explore Courses** or **Continue Learning** that does not navigate; a visible error boundary or error message; a course page missing its modules or instructor. Do not flag slow loading that resolves, or a deliberate empty search state. |
| Recording filters | Current URL matches `/`, `/courses`, or `/courses/*` |
| Session coverage mode | Recordings with at least one page navigation |
| Sampling rate | 1% |
| Model | Gemini 3.5 Flash Lite |

### User-frustration monitor

| Field | Value |
| --- | --- |
| Name | Vertex — learner frustration |
| Scanner type | Monitor |
| Prompt | Watch for the learner getting stuck rather than the app breaking. Flag: repeated clicks on the hero search input, which is read-only today; repeated clicks on the notifications bell, which is presentational (AGENTS §7); back-and-forth navigation between a course page and the catalog without ever starting a lesson. Do not flag ordinary browsing, or a page that is simply broken — the breakage monitor owns that. |
| Recording filters | Current URL matches `/`, `/courses`, or `/courses/*` **and** the session contains `$rageclick` or `$dead_click` |
| Session coverage mode | Recordings with at least one page navigation |
| Sampling rate | 1% |
| Model | Gemini 3.5 Flash Lite |

A conservative baseline estimate against the current project returned 0 matching sessions, 0 estimated monthly observations, and 0 estimated monthly credits at focused 1% sampling with Gemini 3.5 Flash Lite. Replay Vision has 2,500 credits remaining and is not exhausted.

## Session Replay client configuration (2026-09-06)

Recording itself stays enabled by the project toggle, and sampling stays a dashboard decision. What the repo now pins:

| Setting | Value | Why |
| --- | --- | --- |
| `session_recording.maskAllInputs` | `true` | An init-level masking option wins over the project "Privacy and masking" setting, so the privacy floor travels with the repo. Covers the Clerk sign-in and sign-up forms. |
| `session_recording.maskTextSelector` | `.cl-userPreview, .cl-userButtonPopover, [data-ph-mask]` | Clerk renders the learner's name and email in its account popover; inputs masking alone does not cover rendered text. |
| `capture_dead_clicks` | `true` | Rage clicks were already on by default; dead clicks were not. Both feed the user-frustration monitor. |
| `posthog.identify(clerkUserId)` | `components/posthog-identify.tsx` | Recordings and events attribute to the Clerk user id — the id only, no name or email. `posthog.reset()` on sign-out so a shared browser does not merge two learners. |
| network body/header capture | left off | Requests carry Clerk session cookies and Sanity-backed payloads. |

Known limitation: an ad blocker or a privacy-shielded browser can block the lazy-loaded
`dead-clicks-autocapture.js` extension, which surfaces as `[PostHog.js] [Dead Clicks] failed
to load script {}` in the console. Ingestion, replay and the other extensions go through the
same `/ingest` proxy and keep working; only dead-click capture is lost for that visitor, so
the frustration scanner sees a slightly undercounted `$dead_click` population. There is no
code-side fix — the block is on the extension's filename.

Known limitation: the provider video embeds (YouTube, Vimeo, Bunny) are cross-origin iframes and will appear blank in replays. `recordCrossOriginIframes` cannot fix that, because we do not control the framed document.

## Files modified or created

| File | Change |
| --- | --- |
| `posthog-self-driving-report.md` | Created this configuration record; later updated with the Session Replay client configuration and the two Replay Vision monitor briefs. |
| `instrumentation-client.ts` | Added `session_recording` masking (`maskAllInputs`, `maskTextSelector`) and `capture_dead_clicks: true`. |
| `components/posthog-identify.tsx` | Created: identifies the session by Clerk user id, resets on sign-out. |
| `app/layout.tsx` | Mounts `PostHogIdentify` inside `ClerkProvider`. |
| `.env.example` | Added `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`. |
| `prompts/posthog-session-replay.md` | Implementation prompt for this change.

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) so Support ticket signals can arrive.
- [ ] Grant the PostHog MCP connection `property_definition:read`, then rerun Replay Vision setup to validate event/query shapes.
- [x] Write the two Replay Vision scanner configs in PostHog's six-field shape (see above).
- [x] Add the PostHog MCP server at user scope.
- [x] Authenticate the PostHog MCP and create the scanners — three are live, see `posthog-replay-vision-report.md`.
- [ ] Once real traffic lands, review the as-built sampling (1.0 / 0.5 / 0.1) and model (`gemini-3-flash-preview`, 5 credits per observation) against the 2,500-credit balance.
- [ ] Generate session recordings through the web app, then create the two monitors from the briefs above.
- [ ] Add search-result, video-playback, and lesson-completion outcome events when those product flows ship; this will support stronger learning-search and lesson-progress monitoring.

## What happens next

The scout coordinator picks up new configurations within about 30 minutes. Scouts draw from the verified 100-run daily budget, cluster their findings into reports, and place them in the [Self-driving inbox](https://eu.posthog.com/project/266997/inbox). Immediately actionable reports can start coding tasks.