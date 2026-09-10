"use client";

import { useMemo, useState } from "react";
import { CourseGrid } from "@/components/cards/course-grid";
import { formatLevel, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { COURSES_QUERY_RESULT } from "@/sanity.types";

/**
 * The catalog: a filter rail beside the grid.
 *
 * Filtering is client-side on purpose. The whole catalog is one small payload the page
 * already fetched, so filtering it here keeps `/courses` prerendered — reading the
 * filters from `searchParams` instead would make the route dynamic for a list of ten.
 */

type Course = COURSES_QUERY_RESULT[number];

const ALL = "All";

function values(courses: Course[], pick: (course: Course) => string | null | undefined) {
  return [ALL, ...new Set(courses.map(pick).filter((value): value is string => Boolean(value)))];
}

export function Catalog({ courses }: { courses: COURSES_QUERY_RESULT }) {
  const [category, setCategory] = useState(ALL);
  const [level, setLevel] = useState(ALL);

  const categories = useMemo(() => values(courses, (c) => c.category?.title), [courses]);
  const levels = useMemo(() => values(courses, (c) => c.level), [courses]);

  const filtered = courses.filter(
    (course) =>
      (category === ALL || course.category?.title === category) &&
      (level === ALL || course.level === level),
  );

  return (
    <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-10">
      <aside className="shrink-0 lg:w-[180px]">
        <Filter label="Category" options={categories} value={category} onChange={setCategory} />
        <Filter
          label="Level"
          options={levels}
          value={level}
          onChange={setLevel}
          format={formatLevel}
          className="mt-8"
        />
      </aside>

      <div className="min-w-0 flex-1">
        <p className="text-data text-ink-muted">{pluralize(filtered.length, "course")}</p>
        {filtered.length > 0 ? (
          <CourseGrid courses={filtered} className="mt-4 lg:grid-cols-2 xl:grid-cols-3" />
        ) : (
          <p className="mt-4 text-body text-ink-muted">
            No course matches those filters.
          </p>
        )}
      </div>
    </div>
  );
}

function Filter({
  label,
  options,
  value,
  onChange,
  format = (option: string) => option,
  className,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  format?: (option: string) => string;
  className?: string;
}) {
  /* A single-option filter (or none at all) is not a choice, so it is not drawn. */
  if (options.length < 3) return null;

  return (
    <div className={className}>
      <h2 className="text-meta text-ink-muted">{label}</h2>
      <ul className="mt-3 flex flex-wrap gap-1 lg:flex-col">
        {options.map((option) => (
          <li key={option}>
            <button
              type="button"
              aria-pressed={option === value}
              onClick={() => onChange(option)}
              className={cn(
                "w-full rounded-xs px-2 py-1.5 text-left text-body transition-colors",
                option === value
                  ? "bg-raised text-ink"
                  : "text-ink-muted hover:bg-raised hover:text-ink",
              )}
            >
              {option === ALL ? ALL : format(option)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
