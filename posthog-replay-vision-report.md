# PostHog Replay Vision — What's Now Watching Vertex

## What Is Recording

Session recording is **live**. The project had `session_replay` already enabled on PostHog project 266997. The client-side SDK (`instrumentation-client.ts`) initializes PostHog with masking options (`maskAllInputs`, `maskTextSelector`) for privacy — no `disable_session_recording` override exists, so recordings flow immediately for every visitor.

> First recordings will appear in [PostHog → Session Replay](https://eu.posthog.com/project/266997/replay) as soon as users visit the site.

---

## Scanners Created

### 1. Course learning frustration
| Field | Value |
|---|---|
| **ID** | `01a07576-7768-7b0d-9e07-4e2c67c0e6ef` |
| **Type** | Monitor |
| **Trigger** | `$rageclick` (site-wide, no URL scope) |
| **Sampling rate** | 0.01 (1% of matched sessions) |
| **Model** | `gemini-3.5-flash-lite` (2 credits per observation) |
| **Status** | Enabled |
| **Est. monthly credits** | 0 (no traffic yet; rises with usage) |

**Watches for:** Repeated clicks on the hero search input (read-only today), repeated clicks on the presentational notifications bell, hammering the bookmark button with no visible feedback, toggling "Show all modules" without expansion, and back-and-forth navigation between a course page and the catalog without ever starting a lesson. An unresponsive Continue Learning control and a silently failing sign-in form belong to "Course page breakage" instead, and dead lesson rows are no longer listed at all now that `/lessons/[slug]` ships.

---

### 2. Course page breakage
| Field | Value |
|---|---|
| **ID** | `01a07578-6e50-7cfb-baa0-5d45e4a8341f` |
| **Type** | Monitor |
| **Trigger** | Any session where `$current_url` contains `/courses` |
| **Sampling rate** | 0.01 (1% of matched sessions) |
| **Model** | `gemini-3.5-flash-lite` (2 credits per observation) |
| **Status** | Enabled |
| **Est. monthly credits** | 0 (no traffic yet; rises with usage) |

**Watches for:** Course detail content not rendering, cover/instructor images failing to load, module list not expanding, Continue Learning button unresponsive, auth forms submitting silently, and course card links leading to broken pages.

---

### 3. Vertex learner session summaries
| Field | Value |
|---|---|
| **ID** | `01a07576-8a70-7df3-a6e2-33cc731463c4` |
| **Type** | Summarizer |
| **Scope** | All sessions (unscoped) |
| **Sampling rate** | 0.1 (1 in 10 sessions) |
| **Model** | `gemini-3.5-flash-lite` (2 credits per observation) |
| **Status** | Enabled |
| **Est. monthly credits** | 0 (no recordings yet; rises with usage) |

**Summarizes:** What learners do across the full session — browsing the course catalog, searching for lessons, watching video lessons, continuing a course, completing lessons, and tracking learning progress.

---

### 4. Frustration score
| Field | Value |
|---|---|
| **ID** | `01a0757b-3b25-71f7-8ced-2c26b5a04b70` |
| **Type** | Scorer, 0-10 frustration scale |
| **Trigger** | All sessions (unscoped) |
| **Sampling rate** | 0.2, `balanced` coverage |
| **Model** | `gemini-3.5-flash-lite` (2 credits per observation) |
| **Status** | Enabled |

**Scores:** how frustrated the learner appeared, 0 for a smooth session to 10 for sustained
frustration. Created from PostHog's template after the two monitors, so it is absent from the
sections above. It composes with the monitors rather than competing: a score is a dimension to
chart and filter on, not a second flag on the same defect.

---

## Cost plan — switch to Flash Lite

Applied 2026-09-06 through the PostHog MCP. All four scanners moved to **Gemini 3.5 Flash
Lite** (2 credits per observation) from `gemini-3-flash-preview` (5), and both monitors
dropped to 1% sampling. Every scanner is at `credits_per_observation: 2`; the tables above
reflect the applied state. Version metadata as of 2026-09-07: the frustration monitor is at
`scanner_version: 3` after the lesson-route correction below, the other three are at 2. Model
and sampling are untouched by that edit, so the cost table still holds.

| Scanner | Model | Sampling |
| --- | --- | --- |
| Course learning frustration | Flash Lite ✅ | 1.0 → 0.01 ✅ |
| Course page breakage | Flash Lite ✅ | 0.5 → 0.01 ✅ |
| Vertex learner session summaries | Flash Lite ✅ | 0.1 unchanged |
| Frustration score | Flash Lite ✅ | 0.2 unchanged |

Model plus sampling together take the monitors from ~2.5× the planned per-observation cost
at 50-100% coverage down to the 1% Flash Lite plan in `prompts/posthog-session-replay.md`.
The summarizer keeps 10% coverage: it is meant to sample the population, not flag defects,
and Flash Lite alone more than halves its burn.

The scorer keeps 0.2 and the summarizer 0.1: both sample the population rather than flag
defects, and Flash Lite alone more than halves their burn. Budget after the change: 2,500
credits remaining of a 2,500 free monthly allowance, 0 used, period ending 2026-10-05.

## Overlap fix — prompt-level ownership

The two monitors both fire on a `/courses` session containing a rage click, and before this
fix both prompts claimed the same symptom ("Continue Learning button unresponsive" /
"repeatedly tapping a disabled Continue Learning button"). That was double credit spend, and
worse, two observations describing one defect look like independent corroboration to the inbox
when they are not.

Rejected: URL-scoping the frustration monitor to `/courses*` makes the overlap total rather
than smaller; excluding `/courses` from it deletes the surface where the frustration actually
is. Session-level filters cannot express "skip what the other scanner took", so the boundary
belongs in the prompts. Triggers stay as they are — breakage answers "did the app fail?" on
the course surfaces, frustration answers "did the learner struggle where the app worked as
built?" anywhere.

Both prompts below are **live** and quoted verbatim from PostHog: breakage as configured on
2026-09-06 (`scanner_version: 2`), frustration as corrected on 2026-09-07 (`scanner_version:
3`). The two duplicated symptoms — an unresponsive Continue Learning button and a silently
failing sign-in form — belong to breakage alone, and each prompt closes by deferring the other
case by name. The 2026-09-07 edit also dropped the frustration prompt's claim that the lesson
route does not exist: `/lessons/[slug]` ships, so a lesson row that goes nowhere is now a
defect breakage owns, not unbuilt-feature friction.

**Course page breakage**

> Watch this session for moments where the product visibly broke for the user: an error
> message or toast, a blank or white screen, content that failed to load, obviously broken
> layout, a spinner that never resolves, or a button, form or action that clearly failed. In
> this product that especially means: course detail content not rendering or showing a blank
> page, course cover images or instructor photos failing to load, the module list not
> expanding or collapsing unexpectedly, the Continue Learning or Start Course button being
> unresponsive, sign-in or sign-up forms submitting silently with no error or confirmation, or
> a course card link leading to a broken or empty page. Only flag issues that are unambiguous
> on screen and would actually matter to the user - ignore cosmetic nits and anything you are
> unsure about. For each: what the user was trying to do, what broke, and the URL.
>
> Do not flag slow loading that resolves, a deliberate empty state, or a control that does
> nothing because the feature is not built yet - the "Course learning frustration" scanner
> owns that.

**Course learning frustration**

> Watch this session for the learner struggling against the product as built, not against a
> defect. Flag: repeated clicks on the hero search input, which is read-only today; repeated
> clicks on the notifications bell, which is presentational; clicking Bookmark repeatedly with
> no visible feedback; toggling the Show all modules control expecting an expansion that is not
> built; back-and-forth navigation between a course page and the catalog without ever starting
> a lesson. Only flag genuine struggle you can see, not normal browsing or a single mis-click.
> For each: what they were trying to do, where they got stuck, and the URL.
>
> Do not flag a page that rendered wrong, errored, failed to load, or a button or form that is
> broken rather than unbuilt - the "Course page breakage" scanner owns that. Lesson pages are
> built and play video on the site, so a lesson row or link that goes nowhere is a defect for
> that scanner, not unbuilt-feature friction.

## Skipped / Deferred

- **Checkout / purchase flow scanner** — No checkout, enrollment, or payment flow exists in the product yet. Prices are stored in Sanity but not surfaced or actionable. If a purchase flow is added, update the Course page breakage scanner to include that URL path.

---

## Where to See Results

All scanner output appears in **[PostHog → Replay Vision](https://eu.posthog.com/project/266997/replay)**.

- **Session recordings** start arriving immediately as users visit the site.
- **Frustration and breakage monitors** will flag sessions automatically once recordings accumulate — each flagged session surfaces with the scanner's findings attached.
- **Session summaries** are generated for ~10% of all sessions and appear inline in the recording view.

No action is needed from you — everything is live and watching.
