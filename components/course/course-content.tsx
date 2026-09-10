"use client";

import Link from "next/link";
import { Check, ChevronDown, Play } from "lucide-react";
import { formatDuration, pluralize } from "@/lib/format";
import { useProgress } from "@/lib/use-progress";
import { cn } from "@/lib/utils";
import type { COURSE_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type Course = NonNullable<COURSE_BY_SLUG_QUERY_RESULT>;
type CourseModule = NonNullable<Course["modules"]>[number];

/**
 * The module tree. Client-side only so the completion ticks can come from the learner's
 * own progress without making the course route dynamic — the tree itself is server data
 * passed in as props.
 *
 * Numbers ("Module 3", "3.2") are positional, never stored (AGENTS §8).
 */
export function CourseContent({ modules }: { modules: CourseModule[] }) {
  const progress = useProgress();
  const completed = progress?.completed;

  return (
    <ol className="mt-6 divide-y divide-line border-y border-line">
      {modules.map((module, index) => (
        <li key={module._key}>
          <ModuleRow module={module} index={index} completed={completed} />
        </li>
      ))}
    </ol>
  );
}

function ModuleRow({
  module,
  index,
  completed,
}: {
  module: CourseModule;
  index: number;
  completed?: Set<string>;
}) {
  const lessons = module.lessons ?? [];
  const done = lessons.filter((lesson) => completed?.has(lesson._id)).length;

  return (
    <details className="group" open={index === 0}>
      <summary className="flex cursor-pointer list-none items-center gap-4 py-4">
        <span className="w-10 shrink-0 text-data text-ink-disabled">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-heading-3 text-ink">{module.title}</span>
          {module.summary && (
            <span className="mt-1 block truncate text-body text-ink-muted">
              {module.summary}
            </span>
          )}
        </span>
        <span className="shrink-0 text-data text-ink-muted">
          {done > 0 && `${done}/${lessons.length} · `}
          {formatDuration(module.duration)}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="shrink-0 text-ink-muted transition-transform group-open:rotate-180"
        />
      </summary>

      <ol className="pb-4 pl-10">
        {lessons.map((lesson, lessonIndex) => {
          const isDone = Boolean(completed?.has(lesson._id));
          const row = (
            <>
              <span className="w-10 shrink-0 text-data text-ink-disabled">
                {index + 1}.{lessonIndex + 1}
              </span>
              {isDone ? (
                <Check size={14} aria-hidden="true" className="shrink-0 text-success" />
              ) : (
                <Play size={12} aria-hidden="true" className="shrink-0 text-ink-disabled" />
              )}
              <span className="min-w-0 flex-1 truncate text-body text-ink">{lesson.title}</span>
              {lesson.freePreview && <span className="shrink-0 text-meta text-accent">Free</span>}
              <span className="shrink-0 text-data text-ink-muted">
                {formatDuration(lesson.duration)}
              </span>
            </>
          );
          const className = "flex items-center gap-3 rounded-xs px-2 py-2 -mx-2";
          return (
            <li key={lesson._id}>
              {lesson.slug ? (
                <Link
                  href={`/lessons/${lesson.slug}`}
                  className={cn(className, "transition-colors hover:bg-raised")}
                >
                  {row}
                </Link>
              ) : (
                <span className={className}>{row}</span>
              )}
            </li>
          );
        })}
        {lessons.length === 0 && (
          <p className="py-2 text-body text-ink-muted">{pluralize(0, "lesson")}</p>
        )}
      </ol>
    </details>
  );
}
