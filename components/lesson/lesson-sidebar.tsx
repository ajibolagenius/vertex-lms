"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { useProgress } from "@/lib/use-progress";
import { cn } from "@/lib/utils";
import type { LESSON_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type CourseDoc = NonNullable<NonNullable<LESSON_BY_SLUG_QUERY_RESULT>["course"]>;

/**
 * The course tree beside the lesson. Every module is a native `<details>`, so the tree
 * works before hydration; only the module holding the current lesson starts open.
 *
 * The ticks and the percentage come from the learner's own progress, read client-side so
 * the lesson route stays prerendered (see `lib/use-progress.ts`).
 */
export function LessonSidebar({
  course,
  currentLessonId,
  currentModuleIndex,
}: {
  course: CourseDoc;
  currentLessonId: string;
  currentModuleIndex: number;
}) {
  const progress = useProgress();
  const completed = progress?.completed ?? new Set<string>();

  const modules = course.modules ?? [];
  const lessonIds = modules.flatMap((m) => (m.lessons ?? []).map((l) => l._id));
  const doneCount = lessonIds.filter((id) => completed.has(id)).length;
  const percent = lessonIds.length ? Math.round((doneCount / lessonIds.length) * 100) : 0;

  return (
    <aside
      className={cn(
        "order-3 w-full shrink-0 border-t border-line lg:order-1 lg:w-[290px] lg:border-t-0 lg:border-r",
        // Its own scroll on desktop, so a long tree never drags the page with it.
        "lg:sticky lg:top-14 lg:max-h-[calc(100vh-3.5rem)] lg:overflow-y-auto",
      )}
    >
      <div className="border-b border-line px-5 py-5">
        {course.slug && (
          <Link
            href={`/courses/${course.slug}`}
            className="inline-flex items-center gap-2 text-data text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to course
          </Link>
        )}
        <p className="mt-4 text-heading-3 text-ink">{course.title}</p>
        {progress && (
        <div className="mt-3 flex items-center gap-3">
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
            {doneCount}/{lessonIds.length}
          </span>
        </div>
        )}
      </div>

      <ol className="pb-8">
        {modules.map((module, index) => (
          <li key={module._key} className="border-b border-line">
            <ModuleBranch
              module={module}
              index={index}
              isCurrent={index === currentModuleIndex}
              currentLessonId={currentLessonId}
              completed={completed}
            />
          </li>
        ))}
      </ol>
    </aside>
  );
}

function ModuleBranch({
  module,
  index,
  isCurrent,
  currentLessonId,
  completed,
}: {
  module: NonNullable<CourseDoc["modules"]>[number];
  index: number;
  isCurrent: boolean;
  currentLessonId: string;
  completed: Set<string>;
}) {
  const lessons = module.lessons ?? [];
  const done = lessons.filter((lesson) => completed.has(lesson._id)).length;
  const isComplete = lessons.length > 0 && done === lessons.length;

  return (
    <details open={isCurrent} className="group/module">
      {/* `list-none` stays: a flex summary hides the native marker anyway, so the
          disclosure affordance is the chevron, as on the course page. */}
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3">
        <span className="w-6 shrink-0 text-data text-ink-disabled">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1 text-body text-ink">{module.title}</span>
        {isComplete ? (
          <Check size={14} aria-hidden="true" className="shrink-0 text-success" />
        ) : (
          <span className="shrink-0 text-data text-ink-disabled">
            {done > 0 ? `${done}/${lessons.length}` : lessons.length}
          </span>
        )}
        <ChevronDown
          size={13}
          aria-hidden="true"
          className="shrink-0 text-ink-disabled transition-transform group-open/module:rotate-180"
        />
      </summary>

      <ol className="pb-2">
        {lessons.map((lesson, lessonIndex) => (
          <li key={lesson._id}>
            <LessonRow
              lesson={lesson}
              label={`${index + 1}.${lessonIndex + 1}`}
              isCurrent={lesson._id === currentLessonId}
              isComplete={completed.has(lesson._id)}
            />
          </li>
        ))}
      </ol>
    </details>
  );
}

function LessonRow({
  lesson,
  label,
  isCurrent,
  isComplete,
}: {
  lesson: NonNullable<NonNullable<CourseDoc["modules"]>[number]["lessons"]>[number];
  label: string;
  isCurrent: boolean;
  isComplete: boolean;
}) {
  const body = (
    <>
      <span
        className={cn(
          "w-6 shrink-0 text-data",
          isCurrent ? "text-accent" : "text-ink-disabled",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 text-body",
          isCurrent ? "text-ink" : "text-ink-muted",
        )}
      >
        {lesson.title}
      </span>
      {isComplete ? (
        <Check size={13} aria-hidden="true" className="shrink-0 text-success" />
      ) : (
        <span className="shrink-0 text-data text-ink-disabled">
          {formatDuration(lesson.duration)}
        </span>
      )}
    </>
  );

  const row = "flex items-center gap-3 px-5 py-2 transition-colors";

  return isCurrent || !lesson.slug ? (
    <div
      aria-current={isCurrent ? "page" : undefined}
      className={cn(row, isCurrent && "border-l-2 border-accent bg-raised pl-[18px]")}
    >
      {body}
    </div>
  ) : (
    <Link href={`/lessons/${lesson.slug}`} className={cn(row, "hover:bg-raised")}>
      {body}
    </Link>
  );
}
