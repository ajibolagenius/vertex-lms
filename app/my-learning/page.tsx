import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";

import { ResumeLink } from "@/components/analytics/resume-link";
import { ViewTracker } from "@/components/analytics/view-tracker";
import { Shell } from "@/components/shell";
import { ProgressBar } from "@/components/ui/progress-bar";
import { pluralize } from "@/lib/format";
import { groupByCourse } from "@/lib/progress";
import { readProgress } from "@/lib/progress-server";

export const metadata: Metadata = {
  title: "My Learning — Vertex",
  description: "The courses you have started and where you left off.",
};

/**
 * Read-only, per learner (AGENTS §7). The record it renders is written by
 * `app/api/progress/route.ts` — opening a lesson records where the learner left off, and
 * the lesson page's complete button marks one done.
 *
 * `proxy.ts` already gates this route; the redirect is the fallback that also narrows
 * `userId` to a string.
 */
export default async function MyLearningPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const courses = groupByCourse(await readProgress(userId));

  return (
    <Shell>
      <ViewTracker event="my_learning_viewed" properties={{ course_count: courses.length }} />

      <header className="flex flex-wrap items-baseline justify-between gap-4 pt-12">
        <div>
          <p className="text-meta text-ink-muted">Your progress</p>
          <h1 className="mt-3 text-title text-ink">My learning</h1>
        </div>
        {courses.length > 0 && (
          <p className="text-data text-ink-muted">
            {pluralize(courses.length, "course")} in progress
          </p>
        )}
      </header>

      {courses.length === 0 ? (
        <div className="mt-10 max-w-[52ch]">
          <p className="text-body text-ink-muted">
            You have not started a course yet. Open a lesson and it will show up here with
            your progress and a link back to where you left off.
          </p>
          <Link
            href="/courses"
            className="mt-5 inline-flex items-center gap-2 text-body text-accent hover:text-accent-hover"
          >
            Browse all courses
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {courses.map((course) => (
            <li
              key={course.slug}
              className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:gap-8"
            >
              <div className="min-w-0 lg:w-[38%]">
                <Link
                  href={`/courses/${course.slug}`}
                  className="text-heading-3 text-ink hover:text-accent"
                >
                  {course.title}
                </Link>
                <p className="mt-1 text-data text-ink-muted">
                  {course.completedCount} of {pluralize(course.totalCount, "lesson")} complete
                </p>
              </div>

              <ProgressBar value={course.percent} className="lg:w-[28%]" />

              <div className="min-w-0 lg:ml-auto lg:text-right">
                {course.resume ? (
                  <ResumeLink
                    href={course.resume.href}
                    title={course.resume.title}
                    lessonSlug={course.resume.slug}
                    courseSlug={course.slug}
                    positionSeconds={course.resume.positionSeconds}
                  />
                ) : (
                  <p className="text-data text-success">Course complete</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
