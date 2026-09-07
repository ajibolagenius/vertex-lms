import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronDown, CircleCheck, Play } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LESSON_BY_SLUG_QUERY_RESULT } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";

type CourseDoc = NonNullable<NonNullable<LESSON_BY_SLUG_QUERY_RESULT>["course"]>;

/**
 * The course tree beside the lesson. Only the module holding the current lesson is
 * expanded, but every module is a native `<details>` so the tree works without JS.
 *
 * `completedLessonIds` is empty until the Clerk-keyed progress record exists
 * (AGENTS §7) — the ticks and the percentage derive from it, so wiring the real
 * record later touches this one prop.
 */
export function LessonSidebar({
  course,
  currentLessonId,
  currentModuleIndex,
  completedLessonIds,
}: {
  course: CourseDoc;
  currentLessonId: string;
  currentModuleIndex: number;
  completedLessonIds: string[];
}) {
  const modules = course.modules ?? [];
  const lessonIds = modules.flatMap((m) => (m.lessons ?? []).map((l) => l._id));
  const completed = new Set(completedLessonIds);
  const percent = lessonIds.length
    ? Math.round((lessonIds.filter((id) => completed.has(id)).length / lessonIds.length) * 100)
    : 0;

  return (
    <aside className="w-full shrink-0 border-t border-line lg:w-[278px] lg:border-t-0 lg:border-r">
      <div className="px-6 py-8 sm:px-10">
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex items-center gap-3 font-display text-[15px] leading-[22px] font-semibold text-primary-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to course
        </Link>

        <div className="mt-7 flex items-start gap-4">
          {course.coverImage?.asset && (
            <Image
              src={urlFor(course.coverImage).width(100).height(100).fit("crop").url()}
              alt=""
              width={50}
              height={50}
              className="size-[50px] shrink-0 rounded-md object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="text-[15px] leading-[20px] font-semibold text-neutral-900">
              {course.title}
            </p>
            <p className="mt-1.5 text-[13px] leading-[18px] text-neutral-500">
              {percent}% complete
            </p>
            <div
              role="progressbar"
              aria-label="Course progress"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2 h-1 w-[70px] overflow-hidden rounded-full bg-neutral-200"
            >
              <div className="h-full rounded-full bg-primary-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <details open className="border-t border-line">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 text-[15px] leading-[22px] text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500 sm:px-7">
          Module {currentModuleIndex + 1} of {modules.length}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="shrink-0 text-primary-500"
          />
        </summary>

        {/* One connector for the whole tree: it runs behind the markers, from the
            first circle's centre to the last row's. Each circle is opaque, so it
            reads as a line threading them (the lesson dots are hollow by design). */}
        <ol className="relative border-t border-line">
          <span
            aria-hidden="true"
            className="absolute top-8 bottom-8 left-[42px] w-px bg-line"
          />
          {modules.map((module, index) => (
            <li key={module._key} className="border-line not-first:border-t">
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
      </details>
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
  const isComplete = lessons.length > 0 && lessons.every((lesson) => completed.has(lesson._id));

  return (
    <details open={isCurrent} className={cn("group/module", isCurrent && "bg-primary-100/30")}>
      <summary className="flex cursor-pointer list-none items-center gap-4 py-[18px] pr-5 pl-7 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500">
        <span
          aria-hidden="true"
          className={cn(
            "relative flex size-7 shrink-0 items-center justify-center rounded-full text-[15px]",
            isCurrent
              ? "bg-primary-500 font-semibold text-white"
              : "border border-line bg-paper text-neutral-900",
          )}
        >
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] leading-[22px] font-semibold text-neutral-900">
            {module.title}
          </span>
          <span className="mt-1 block text-[13px] leading-[18px] text-neutral-500">
            {formatDuration(module.duration)}
          </span>
        </span>
        {isComplete ? (
          <CircleCheck size={18} aria-hidden="true" className="shrink-0 text-primary-500" />
        ) : (
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="shrink-0 text-primary-500 transition-transform group-open/module:rotate-180"
          />
        )}
      </summary>

      <ol className="pb-6">
        {lessons.map((lesson) => (
          <li key={lesson._id}>
            <LessonRow
              lesson={lesson}
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
  isCurrent,
  isComplete,
}: {
  lesson: NonNullable<NonNullable<CourseDoc["modules"]>[number]["lessons"]>[number];
  isCurrent: boolean;
  isComplete: boolean;
}) {
  const body = (
    <>
      <span aria-hidden="true" className="flex w-7 shrink-0 justify-center pt-[7px]">
        <span
          className={cn(
            "size-2 rounded-full border",
            isCurrent || isComplete
              ? "border-primary-500 bg-primary-500"
              : "border-primary-200 bg-transparent",
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-[15px] leading-[22px]",
            isCurrent
              ? "font-semibold text-neutral-900"
              : "text-neutral-700 group-hover/lesson:text-primary-500",
          )}
        >
          {lesson.title}
        </span>
        <span
          className={cn(
            "mt-1 block text-[13px] leading-[18px]",
            isCurrent ? "font-semibold text-primary-500" : "text-neutral-500",
          )}
        >
          {isCurrent ? "Now playing" : formatDuration(lesson.duration)}
        </span>
      </span>
      {isCurrent && (
        <span
          aria-hidden="true"
          className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary-500"
        >
          <Play size={12} className="ml-0.5 fill-white text-white" />
        </span>
      )}
    </>
  );

  const row = "flex items-start gap-4 py-2 pr-5 pl-7";

  return isCurrent ? (
    <div aria-current="page" className={row}>
      {body}
    </div>
  ) : (
    <Link
      href={`/lessons/${lesson.slug}`}
      className={cn(
        row,
        "group/lesson focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500",
      )}
    >
      {body}
    </Link>
  );
}
