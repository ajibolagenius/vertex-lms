import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseGrid } from "@/components/cards/course-grid";
import { HomeCta } from "@/components/home-cta";
import { Shell } from "@/components/shell";
import { sanityFetch } from "@/sanity/lib/fetch";
import { COURSES_QUERY } from "@/sanity/lib/queries";

export default async function Home() {
  const courses = await sanityFetch({ query: COURSES_QUERY });

  return (
    <Shell>
      {/* Search-first: the field is the hero, not a marketing block with a field under it. */}
      <section className="border-b border-line py-16 sm:py-24">
        <p className="text-meta text-accent">Intelligent search</p>
        <h1 className="mt-5 max-w-[18ch] text-display text-ink">
          Search your learning in plain English.
        </h1>
        <p className="mt-5 max-w-[52ch] text-body-lg text-ink-muted">
          Ask for a topic and Vertex returns the exact lessons — and the exact second in
          the video where it is taught.
        </p>

        <HomeCta />
      </section>

      {/* Nothing to show — and no heading or blank grid — on an empty dataset. */}
      {courses.length > 0 && (
        <section className="py-14">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-heading-1 text-ink">Courses</h2>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-body text-accent hover:text-accent-hover"
            >
              View all
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <CourseGrid courses={courses.slice(0, 6)} className="mt-6" />
        </section>
      )}
    </Shell>
  );
}
