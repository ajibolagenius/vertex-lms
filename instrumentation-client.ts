import posthog from "posthog-js";

if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
  if (process.env.NODE_ENV === "development") {
    console.error(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
    );
  }
} else {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",
    capture_exceptions: true,
    // Rage clicks are on by default; dead clicks are not. Both feed the
    // Replay Vision user-frustration monitor.
    capture_dead_clicks: true,
    // Session replay is switched on project-side, and sampling stays a dashboard
    // decision. Masking is set here on purpose: an init-level masking option wins
    // over the project's "Privacy and masking" setting, so the privacy floor
    // travels with the repo and a dashboard change cannot start recording typed text.
    session_recording: {
      maskAllInputs: true,
      // Clerk renders the learner's name and email in its account popover.
      maskTextSelector: ".cl-userPreview, .cl-userButtonPopover, [data-ph-mask]",
    },
    debug: process.env.NODE_ENV === "development",
  });
}

// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.ts is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.
