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
| **Sampling rate** | 1.0 (every matched session) |
| **Model** | `gemini-3-flash-preview` |
| **Status** | Enabled |
| **Est. monthly credits** | 0 (no traffic yet; rises with usage) |

**Watches for:** Clicking lesson rows that look interactive but lead nowhere (lesson route not ready), repeatedly tapping a disabled Continue Learning button, hammering the bookmark button with no visible feedback, toggling "Show all modules" without expansion, and retrying sign-in/sign-up after silent form failures.

---

### 2. Course page breakage
| Field | Value |
|---|---|
| **ID** | `01a07578-6e50-7cfb-baa0-5d45e4a8341f` |
| **Type** | Monitor |
| **Trigger** | Any session where `$current_url` contains `/courses` |
| **Sampling rate** | 0.5 (every other matched session) |
| **Model** | `gemini-3-flash-preview` |
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
| **Model** | `gemini-3-flash-preview` |
| **Status** | Enabled |
| **Est. monthly credits** | 0 (no recordings yet; rises with usage) |

**Summarizes:** What learners do across the full session — browsing the course catalog, searching for lessons, watching video lessons, continuing a course, completing lessons, and tracking learning progress.

---

## Skipped / Deferred

- **Checkout / purchase flow scanner** — No checkout, enrollment, or payment flow exists in the product yet. Prices are stored in Sanity but not surfaced or actionable. If a purchase flow is added, update the Course page breakage scanner to include that URL path.

---

## Where to See Results

All scanner output appears in **[PostHog → Replay Vision](https://eu.posthog.com/project/266997/replay)**.

- **Session recordings** start arriving immediately as users visit the site.
- **Frustration and breakage monitors** will flag sessions automatically once recordings accumulate — each flagged session surfaces with the scanner's findings attached.
- **Session summaries** are generated for ~10% of all sessions and appear inline in the recording view.

No action is needed from you — everything is live and watching.
