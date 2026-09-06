"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import posthog from "posthog-js";

/**
 * Attributes events and session recordings to the Clerk user id (AGENTS §7).
 * The id only — no name or email reaches PostHog.
 */
export function PostHogIdentify() {
  const { isLoaded, userId } = useAuth();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    // Sync with an external system (PostHog), not a response to a user event.
    if (!isLoaded) return;
    const signedOutOf = previousUserId.current;
    previousUserId.current = userId ?? null;

    if (userId) posthog.identify(userId);
    // Only on a real sign-out. Resetting on first load would discard the
    // anonymous distinct id and start a fresh session on every page load.
    else if (signedOutOf) posthog.reset();
  }, [isLoaded, userId]);

  return null;
}
