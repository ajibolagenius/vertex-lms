"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Fires one event on mount, for pages that are server components and have nothing else
 * to render client-side. Same pattern as `CourseViewTracker`/`LessonViewTracker` in
 * `components/course-actions.tsx`, which carry entity props of their own.
 */
export function ViewTracker({
  event,
  properties,
}: {
  event: string;
  properties?: Record<string, unknown>;
}) {
  useEffect(() => {
    // Sync with an external system (PostHog) on mount, not a response to a user event.
    posthog.capture(event, properties);
    // Once per page load, not per re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
