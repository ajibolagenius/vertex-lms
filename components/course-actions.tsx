"use client";

import { useEffect } from "react";
import { ArrowRight, Bookmark } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import posthog from "posthog-js";

export function CourseViewTracker({
  courseSlug,
  courseTitle,
  courseLevel,
}: {
  courseSlug: string;
  courseTitle: string;
  courseLevel?: string;
}) {
  useEffect(() => {
    // Sync with the browser on mount — this is a legitimate use of useEffect
    // (external system: PostHog), not a response to a user event.
    posthog.capture("course_viewed", {
      course_slug: courseSlug,
      course_title: courseTitle,
      course_level: courseLevel,
    });
    // We only want this to fire once per page load, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function BookmarkButton() {
  return (
    <button
      type="button"
      className="inline-flex h-[56px] items-center gap-3 rounded-md border border-line bg-surface px-6 text-[16px] font-medium text-neutral-900 hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      onClick={() => posthog.capture("course_bookmarked")}
    >
      <Bookmark size={18} aria-hidden="true" />
      Bookmark
    </button>
  );
}

export function ContinueLearningButton({ href }: { href: string }) {
  return (
    // Wrap in a span to capture the click without modifying ButtonLink's props
    <span onClick={() => posthog.capture("course_started")}>
      <ButtonLink href={href} size="xl" className="h-[56px] px-7">
        Continue Learning
        <ArrowRight size={18} aria-hidden="true" />
      </ButtonLink>
    </span>
  );
}
