"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Bookmark, CircleCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { saveProgress } from "@/lib/progress-client";
import { startSecondsFrom } from "@/lib/video";
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

/**
 * Fires the view event and, for a signed-in learner, records that the lesson was started —
 * that is what puts the course on `/my-learning`.
 *
 * Deliberately position-free: *where* the learner is comes from real playback, written by
 * `LessonVideo`. Writing `?t=` here would record a search deep link the learner never
 * watched as their resume point, and writing 0 on a plain visit would wipe the position
 * they already had.
 */
export function LessonViewTracker({
  lessonId,
  lessonSlug,
  lessonTitle,
  courseSlug,
  moduleIndex,
}: {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  courseSlug?: string;
  moduleIndex: number;
}) {
  const { isSignedIn } = useAuth();
  /* `?t=` is the second a search result deep-links to, so resuming returns to it. Read here
     rather than from the page's searchParams so the route still prerenders — the caller
     supplies the Suspense boundary that needs. */
  const startSeconds = startSecondsFrom(useSearchParams().get("t"));

  useEffect(() => {
    // Sync with the browser on mount — external system (PostHog), not a user event.
    posthog.capture("lesson_viewed", {
      lesson_slug: lessonSlug,
      lesson_title: lessonTitle,
      course_slug: courseSlug,
      module_index: moduleIndex,
      // 0 unless the learner arrived from a resume link or a search deep link.
      resumed_from_seconds: startSeconds,
    });
    // Once per page load, not per re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    saveProgress({ lessonId });
  }, [isSignedIn, lessonId]);

  return null;
}

/**
 * Completion is explicit (AGENTS §7): the learner says so. The lesson page is prerendered, so
 * the current state is read from the API on mount rather than rendered into the HTML.
 */
export function MarkCompleteButton({
  lessonId,
  lessonSlug,
  courseSlug,
  moduleIndex,
}: {
  lessonId: string;
  lessonSlug: string;
  courseSlug?: string;
  moduleIndex: number;
}) {
  const { isSignedIn } = useAuth();
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    fetch("/api/progress")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const record = data.lessons?.find(
          (entry: { lessonId: string }) => entry.lessonId === lessonId,
        );
        setCompleted(Boolean(record?.completed));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, lessonId]);

  if (!isSignedIn) return null;

  const isComplete = completed === true;

  return (
    <button
      type="button"
      disabled={saving}
      aria-pressed={isComplete}
      onClick={async () => {
        const next = !isComplete;
        setSaving(true);
        const ok = await saveProgress({ lessonId, completed: next });
        setSaving(false);
        if (!ok) return;
        setCompleted(next);
        posthog.capture(next ? "lesson_completed" : "lesson_uncompleted", {
          lesson_slug: lessonSlug,
          course_slug: courseSlug,
          module_index: moduleIndex,
        });
      }}
      className={`inline-flex h-14 items-center gap-3 rounded-md border px-6 text-[15px] leading-[22px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-60 ${
        isComplete
          ? "border-transparent bg-primary-100 text-primary-600"
          : "border-line bg-surface text-neutral-900 hover:bg-primary-100"
      }`}
    >
      <CircleCheck size={18} aria-hidden="true" />
      {isComplete ? "Completed" : "Mark as complete"}
    </button>
  );
}

/** The icon-only bookmark control in the lesson header. Presentational (AGENTS §7). */
