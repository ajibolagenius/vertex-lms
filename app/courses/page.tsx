import type { Metadata } from "next";
import { SiteHeader } from "@/components/nav/site-header";
import { CourseGrid } from "@/components/cards/course-grid";
import { ChartDecoration } from "@/components/decor/chart-decoration";
import { pluralize } from "@/lib/format";
import { sanityFetch } from "@/sanity/lib/fetch";
import { COURSES_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "All Courses — Vertex",
  description: "Every course on Vertex, newest and most popular first.",
};

export default async function CoursesPage() {
  const courses = await sanityFetch({ query: COURSES_QUERY });

  return (
    <div className="flex-1 bg-hatch px-0 sm:px-8">
      <div className="mx-auto w-full max-w-[1440px] border-x border-line bg-paper">
        <SiteHeader />

        <main className="px-6 pt-14 sm:px-12">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-display text-[28px] leading-[38px] text-black">
              All Courses
            </h1>
            <p className="text-[15px] leading-[22px] text-neutral-500">
              {pluralize(courses.length, "course")}
            </p>
          </div>

          {courses.length > 0 ? (
            <CourseGrid courses={courses} className="mt-8" />
          ) : (
            <p className="mt-8 text-[16px] leading-[24px] text-neutral-500">
              No courses have been published yet.
            </p>
          )}
        </main>

        <ChartDecoration className="mt-16" />
      </div>
    </div>
  );
}
