import type { Metadata } from "next";
import { ViewTracker } from "@/components/analytics/view-tracker";
import { Catalog } from "@/components/catalog/catalog";
import { Shell } from "@/components/shell";
import { sanityFetch } from "@/sanity/lib/fetch";
import { COURSES_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "All Courses — Vertex",
  description: "Every course on Vertex, newest and most popular first.",
};

export default async function CoursesPage() {
  const courses = await sanityFetch({ query: COURSES_QUERY });

  return (
    <Shell>
      <ViewTracker event="catalog_viewed" properties={{ course_count: courses.length }} />

      <header className="pt-12">
        <p className="text-meta text-ink-muted">Catalog</p>
        <h1 className="mt-3 text-title text-ink">All courses</h1>
      </header>

      {courses.length > 0 ? (
        <Catalog courses={courses} />
      ) : (
        <p className="mt-8 text-body text-ink-muted">No courses have been published yet.</p>
      )}
    </Shell>
  );
}
