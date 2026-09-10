import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Code,
  Gauge,
  Layers,
  type LucideIcon,
  Puzzle,
  Rocket,
  Shield,
  Sparkles,
  Workflow,
} from "lucide-react";
import { CourseContent } from "@/components/course/course-content";
import { CourseProgress } from "@/components/course/course-progress";
import { CourseViewTracker } from "@/components/course-actions";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Shell } from "@/components/shell";
import { formatCount, formatDuration, formatLevel, pluralize } from "@/lib/format";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/fetch";
import { COURSE_BY_SLUG_QUERY, COURSE_SLUGS_QUERY } from "@/sanity/lib/queries";

/** The eight icon names `learningOutcome.icon` allows. */
const outcomeIcons: Record<string, LucideIcon> = {
  layers: Layers,
  workflow: Workflow,
  gauge: Gauge,
  rocket: Rocket,
  sparkles: Sparkles,
  shield: Shield,
  puzzle: Puzzle,
  code: Code,
};

async function getCourse(slug: string) {
  return sanityFetch({ query: COURSE_BY_SLUG_QUERY, params: { slug } });
}

export async function generateStaticParams() {
  const slugs = await sanityFetch({ query: COURSE_SLUGS_QUERY, fresh: true });
  return slugs.filter((slug): slug is string => Boolean(slug)).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return {};
  return {
    title: `${course.title} — Vertex`,
    description: course.summary ?? undefined,
  };
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const modules = course.modules ?? [];
  const outcomes = course.learningOutcomes ?? [];
  const moduleCount = course.moduleCount ?? modules.length;
  const firstLesson = modules.flatMap((m) => m.lessons ?? [])[0];
  const firstLessonHref = firstLesson?.slug ? `/lessons/${firstLesson.slug}` : null;

  const meta = [
    course.level ? formatLevel(course.level) : null,
    formatDuration(course.duration),
    pluralize(moduleCount, "module"),
    pluralize(course.lessonCount ?? 0, "lesson"),
    typeof course.studentCount === "number"
      ? `${formatCount(course.studentCount)} students`
      : null,
  ].filter(Boolean) as string[];

  return (
    <Shell>
      <CourseViewTracker
        courseSlug={slug}
        courseTitle={course.title ?? ""}
        courseLevel={course.level ?? undefined}
      />

      <div className="pt-6">
        <Breadcrumbs
          items={[
            { label: "Courses", href: "/courses" },
            { label: course.title ?? "Course" },
          ]}
        />
      </div>

      <section className="flex flex-col gap-10 border-b border-line py-10 lg:flex-row lg:gap-16">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-meta text-ink-muted">
            {course.category?.title && <span>{course.category.title}</span>}
            {course.popular && <span className="text-accent">Popular</span>}
          </p>

          <h1 className="mt-4 text-display text-ink">{course.title}</h1>

          {course.summary && (
            <p className="mt-5 max-w-[60ch] text-body-lg text-ink-muted">{course.summary}</p>
          )}

          <ul className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-data text-ink-muted">
            {meta.map((item, index) => (
              <li key={item} className="flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden="true" className="text-ink-disabled">
                    ·
                  </span>
                )}
                {item}
              </li>
            ))}
          </ul>

          <CourseProgress courseSlug={slug} firstLessonHref={firstLessonHref} />

          {course.instructor && (
            <div className="mt-8 flex items-center gap-3 border-t border-line pt-6">
              {course.instructor.photo?.asset && (
                <Image
                  src={urlFor(course.instructor.photo).width(72).height(72).fit("crop").url()}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover"
                />
              )}
              <p className="min-w-0 text-body text-ink-muted">
                Taught by <span className="text-ink">{course.instructor.name}</span>
                {course.instructor.expertise?.length
                  ? ` · ${course.instructor.expertise.join(", ")}`
                  : ""}
              </p>
            </div>
          )}
        </div>

        {course.coverImage?.asset && (
          <Image
            src={urlFor(course.coverImage).width(880).height(660).fit("crop").url()}
            alt={course.coverImage.alt ?? ""}
            width={440}
            height={330}
            priority
            className="aspect-4/3 w-full shrink-0 rounded-md border border-line object-cover lg:w-[380px]"
          />
        )}
      </section>

      {outcomes.length > 0 && (
        <section className="border-b border-line py-12">
          <h2 className="text-heading-1 text-ink">What you&rsquo;ll learn</h2>
          <ul className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {outcomes.map((outcome) => {
              const Icon = outcomeIcons[outcome.icon ?? ""] ?? Sparkles;
              return (
                <li key={outcome._key} className="flex gap-4">
                  <Icon
                    size={18}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-accent"
                  />
                  <div className="min-w-0">
                    <h3 className="text-heading-3 text-ink">{outcome.title}</h3>
                    <p className="mt-1 text-body text-ink-muted">{outcome.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="py-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-heading-1 text-ink">Course content</h2>
          <p className="text-data text-ink-muted">
            {pluralize(moduleCount, "module")} · {formatDuration(course.duration)}
          </p>
        </div>

        <CourseContent modules={modules} />

        {firstLessonHref && (
          <Link
            href={firstLessonHref}
            className="mt-8 inline-flex text-body text-accent hover:text-accent-hover"
          >
            Start with the first lesson
          </Link>
        )}
      </section>
    </Shell>
  );
}
