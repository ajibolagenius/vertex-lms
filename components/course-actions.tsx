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

export function LessonViewTracker({
  lessonSlug,
  lessonTitle,
  courseSlug,
  moduleIndex,
}: {
  lessonSlug: string;
  lessonTitle: string;
  courseSlug?: string;
  moduleIndex: number;
}) {
  useEffect(() => {
    // Sync with the browser on mount — external system (PostHog), not a user event.
    posthog.capture("lesson_viewed", {
      lesson_slug: lessonSlug,
      lesson_title: lessonTitle,
      course_slug: courseSlug,
      module_index: moduleIndex,
    });
    // Once per page load, not per re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/** The icon-only bookmark control in the lesson header. Presentational (AGENTS §7). */
export function BookmarkIconButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={`Bookmark ${label}`}
      className="flex size-11 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-primary-500 hover:bg-primary-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      onClick={() => posthog.capture("lesson_bookmarked")}
    >
      <Bookmark size={18} aria-hidden="true" />
    </button>
  );
}
