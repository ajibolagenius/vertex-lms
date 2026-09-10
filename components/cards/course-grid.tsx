"use client";

import Image from "next/image";
import { CourseCard } from "@/components/cards/course-card";
import { formatDuration, formatLevel, pluralize } from "@/lib/format";
import { useProgress } from "@/lib/use-progress";
import { cn } from "@/lib/utils";
import type { COURSES_QUERY_RESULT } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";

/**
 * The catalog grid, shared by the home page and `/courses`.
 *
 * Client-side only for the progress marks (AGENTS §7): the courses themselves are
 * fetched and passed in by the server component, so the page still prerenders and the
 * percentages fill in after hydration for a signed-in learner.
 */
export function CourseGrid({
  courses,
  className,
}: {
  courses: COURSES_QUERY_RESULT;
  className?: string;
}) {
  const progress = useProgress();

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {courses.map((course) => (
        <CourseCard
          key={course._id}
          href={course.slug ? `/courses/${course.slug}` : undefined}
          title={course.title ?? "Untitled course"}
          description={course.summary ?? ""}
          level={course.level ? formatLevel(course.level) : "—"}
          duration={formatDuration(course.duration)}
          lessons={pluralize(course.lessonCount ?? 0, "lesson")}
          popular={Boolean(course.popular)}
          progress={
            progress?.byCourse.find((entry) => entry.slug === course.slug)?.percent ?? null
          }
          mark={
            course.coverImage?.asset ? (
              <Image
                src={urlFor(course.coverImage).width(80).height(80).fit("crop").url()}
                alt={course.coverImage.alt ?? ""}
                width={40}
                height={40}
                className="size-full object-cover"
              />
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
