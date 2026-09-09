import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";

import { ResumeLink } from "@/components/analytics/resume-link";
import { ViewTracker } from "@/components/analytics/view-tracker";
import { SiteHeader } from "@/components/nav/site-header";
import { Card } from "@/components/ui/card";
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
    <div className="flex-1 bg-hatch px-0 sm:px-8">
      <div className="mx-auto w-full max-w-[1440px] border-x border-line bg-paper">
        <SiteHeader />
        <ViewTracker event="my_learning_viewed" properties={{ course_count: courses.length }} />

        <main className="px-6 pt-14 pb-16 sm:px-12">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-display text-[28px] leading-[38px] text-black">My Learning</h1>
            {courses.length > 0 && (
              <p className="text-[15px] leading-[22px] text-neutral-500">
                {pluralize(courses.length, "course")} in progress
              </p>
            )}
          </div>

          {courses.length === 0 ? (
            <div className="mt-8 max-w-[520px]">
              <p className="text-[16px] leading-[24px] text-neutral-500">
                You have not started a course yet. Open a lesson and it will show up here with
                your progress and a link back to where you left off.
              </p>
              <Link
                href="/courses"
                className="mt-6 inline-flex items-center gap-2 text-[15px] leading-[22px] font-semibold text-primary-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              >
                Browse all courses
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <ul className="mt-8 grid gap-4 lg:grid-cols-2">
              {courses.map((course) => (
                <li key={course.slug}>
                  <Card className="flex h-full flex-col gap-5">
                    <div>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="font-display text-[20px] leading-[28px] font-bold text-black hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                      >
                        {course.title}
                      </Link>
                      <p className="mt-1 text-[14px] leading-[20px] text-neutral-500">
                        {course.completedCount} of {pluralize(course.totalCount, "lesson")}{" "}
                        complete
                      </p>
                    </div>

                    <ProgressBar value={course.percent} />

                    <div className="mt-auto pt-1">
                      {course.resume ? (
                        <ResumeLink
                          href={course.resume.href}
                          title={course.resume.title}
                          lessonSlug={course.resume.slug}
                          courseSlug={course.slug}
                          positionSeconds={course.resume.positionSeconds}
                        />
                      ) : (
                        <p className="text-[15px] leading-[22px] font-semibold text-success">
                          Course complete
                        </p>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
