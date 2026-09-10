"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Check } from "lucide-react";
import { saveProgress } from "@/lib/progress-client";
import { invalidateProgress, useProgress } from "@/lib/use-progress";
import { startSecondsFrom } from "@/lib/video";
import { cn } from "@/lib/utils";
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
    saveProgress({ lessonId }).then(invalidateProgress);
  }, [isSignedIn, lessonId]);

  return null;
}

/**
 * Completion is explicit (AGENTS §7): the learner says so. The lesson page is prerendered,
 * so the current state comes from the shared client-side progress read rather than from
 * the HTML.
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
  const progress = useProgress();
  /** Set once the learner clicks; before that the shared read is the truth. */
  const [override, setOverride] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isSignedIn) return null;

  const isComplete = override ?? Boolean(progress?.completed.has(lessonId));

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
        setOverride(next);
        // The tree and the catalog re-read on their next mount rather than showing a
        // percentage that no longer matches this button.
        invalidateProgress();
        posthog.capture(next ? "lesson_completed" : "lesson_uncompleted", {
          lesson_slug: lessonSlug,
          course_slug: courseSlug,
          module_index: moduleIndex,
        });
      }}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-sm border px-4 text-[15px] font-medium transition-colors disabled:opacity-60",
        isComplete
          ? "border-transparent bg-accent-soft text-accent"
          : "border-line-strong text-ink hover:border-ink hover:bg-raised",
      )}
    >
      <Check size={16} aria-hidden="true" />
      {isComplete ? "Completed" : "Mark as complete"}
    </button>
  );
}
