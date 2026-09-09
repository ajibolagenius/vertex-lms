/**
 * Turning a learner's flat progress records into what `/my-learning` renders.
 *
 * Pure and structurally typed so it does not depend on TypeGen's query result shape,
 * and so `lib/progress.check.mjs` can exercise it without a datastore.
 */

export type ProgressRecord = {
  completed?: boolean | null;
  positionSeconds?: number | null;
  updatedAt?: string | null;
  lessonId?: string | null;
  lesson?: {title?: string | null; slug?: string | null} | null;
  course?: {
    title?: string | null;
    slug?: string | null;
    /** Every lesson id in the course — the denominator of the percentage. */
    lessonIds?: (string | null)[] | null;
  } | null;
};

export type CourseProgress = {
  slug: string;
  title: string;
  completedCount: number;
  totalCount: number;
  percent: number;
  /** Most recently touched lesson that is not complete, if any. */
  resume: {title: string; slug: string; href: string; positionSeconds: number} | null;
  updatedAt: string;
};

/**
 * Groups records by course, newest course first.
 *
 * A record whose course or lesson slug is missing is dropped — that is a lesson no longer
 * referenced by any course, and it has nowhere to link to. `totalCount` comes from the
 * course's own lesson list rather than from how many records exist, so a course a learner
 * has barely started still reads out of its true total.
 */
export function groupByCourse(records: ProgressRecord[]): CourseProgress[] {
  const byCourse = new Map<string, {record: ProgressRecord; entries: ProgressRecord[]}>();

  for (const record of records) {
    const slug = record.course?.slug;
    if (!slug || !record.lesson?.slug) continue;
    const group = byCourse.get(slug);
    if (group) group.entries.push(record);
    else byCourse.set(slug, {record, entries: [record]});
  }

  const courses = [...byCourse.entries()].map(([slug, {record, entries}]) => {
    // Records arrive newest first, so the first incomplete one is where to resume.
    const next = entries.find((entry) => !entry.completed);
    const seconds = next?.positionSeconds ?? 0;
    const lessonIds = (record.course?.lessonIds ?? []).filter(Boolean);
    const completedCount = entries.filter((entry) => entry.completed).length;
    const totalCount = Math.max(lessonIds.length, entries.length);

    return {
      slug,
      title: record.course?.title ?? "Untitled course",
      completedCount,
      totalCount,
      percent: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
      resume: next
        ? {
            title: next.lesson?.title ?? "Continue",
            slug: next.lesson?.slug as string,
            href: `/lessons/${next.lesson?.slug}${seconds > 0 ? `?t=${seconds}` : ""}`,
            positionSeconds: seconds,
          }
        : null,
      updatedAt: entries[0]?.updatedAt ?? "",
    };
  });

  return courses.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
