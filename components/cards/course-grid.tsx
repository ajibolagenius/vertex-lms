import Image from "next/image";
import { CourseCard } from "@/components/cards/course-card";
import { formatDuration, formatLevel, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { COURSES_QUERY_RESULT } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";

/** The catalog grid, shared by the home page's "All Courses" section and `/courses`. */
export function CourseGrid({
  courses,
  className,
}: {
  courses: COURSES_QUERY_RESULT;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {courses.map((course) => (
        <CourseCard
          key={course._id}
          variant="feature"
          href={course.slug ? `/courses/${course.slug}` : undefined}
          title={course.title ?? "Untitled course"}
          description={course.summary ?? ""}
          level={course.level ? formatLevel(course.level) : "—"}
          duration={formatDuration(course.duration)}
          modules={pluralize(course.moduleCount ?? 0, "module")}
          mark={
            course.coverImage?.asset ? (
              <Image
                src={urlFor(course.coverImage).width(144).height(144).fit("crop").url()}
                alt={course.coverImage.alt ?? ""}
                width={72}
                height={72}
                className="size-full rounded-lg object-cover"
              />
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
