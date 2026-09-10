"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { ArrowRight } from "lucide-react";
import { useProgress } from "@/lib/use-progress";

/**
 * The course's own progress line and its resume action (AGENTS §7).
 *
 * Signed out, or not started, it falls back to the first lesson — so the control is
 * always the same shape and only its label and target change.
 */
export function CourseProgress({
  courseSlug,
  firstLessonHref,
}: {
  courseSlug: string;
  firstLessonHref: string | null;
}) {
  const progress = useProgress();
  const course = progress?.byCourse.find((entry) => entry.slug === courseSlug);
  const percent = course?.percent ?? 0;
  const href = course?.resume?.href ?? firstLessonHref;

  if (!href) return null;

  const started = Boolean(course && percent > 0);

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
      <Link
        href={href}
        onClick={() =>
          posthog.capture(started ? "course_resumed" : "course_started", {
            course_slug: courseSlug,
            percent,
          })
        }
        className="inline-flex h-11 items-center gap-2 rounded-sm bg-accent px-5 text-[15px] font-medium text-on-accent transition-colors hover:bg-accent-hover"
      >
        {started ? "Continue learning" : "Start course"}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>

      {started && (
        <span className="flex min-w-[200px] flex-1 items-center gap-3">
          <span
            role="progressbar"
            aria-label="Course progress"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1 flex-1 overflow-hidden rounded-full bg-raised"
          >
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${percent}%` }}
            />
          </span>
          <span className="text-data text-ink-muted">
            {course?.completedCount}/{course?.totalCount} · {percent}%
          </span>
        </span>
      )}
    </div>
  );
}
