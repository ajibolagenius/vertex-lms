import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  ChartNoAxesColumn,
  ChevronDown,
  Clock,
  Code,
  File,
  Gauge,
  Layers,
  type LucideIcon,
  Play,
  Puzzle,
  Rocket,
  Shield,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { ChartDecoration } from "@/components/decor/chart-decoration";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { SiteHeader } from "@/components/nav/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatCount, formatDuration, formatLevel, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  COURSE_BY_SLUG_QUERY,
  COURSE_SLUGS_QUERY,
} from "@/sanity/lib/queries";

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

/** Modules beyond this many hide behind the "Show all" pill, as in the reference. */
const COLLAPSE_AFTER = 6;

/**
 * The `/lessons/[slug]` route does not exist yet, so lesson links would 404.
 * Until it lands, lesson rows render inert and the "Continue Learning" calls to
 * action are omitted. Flip this to `true` when the lesson page ships.
 */
const LESSON_ROUTE_READY: boolean = false;

const panel = "rounded-lg border border-line bg-surface";
const lessonRow = "flex items-center gap-4 rounded-md py-3 text-[14px] leading-[20px]";

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
  /* Progress is not implemented yet (AGENTS §7), so the CTA resumes at the first lesson. */
  const resumeHref =
    LESSON_ROUTE_READY && firstLesson?.slug ? `/lessons/${firstLesson.slug}` : null;
  const duration = formatDuration(course.duration);

  return (
    <div className="flex-1 bg-hatch px-0 sm:px-8">
      <div className="mx-auto w-full max-w-[1440px] border-x border-line bg-paper">
        <SiteHeader />

        <main className="px-6 pt-7 sm:px-8">
          <Breadcrumbs
            items={[
              { label: "All Courses", href: "/courses" },
              { label: course.title ?? "Course" },
            ]}
          />

          {/* Hero */}
          <section className="mt-9 flex flex-col gap-8 lg:flex-row lg:gap-[60px]">
            {course.coverImage?.asset && (
              <Image
                src={urlFor(course.coverImage).width(560).height(656).fit("crop").url()}
                alt={course.coverImage.alt ?? ""}
                width={280}
                height={328}
                priority
                className="h-[328px] w-full shrink-0 rounded-lg object-cover lg:w-[280px]"
              />
            )}

            <div className="min-w-0 max-w-[560px]">
              {course.popular && <Badge variant="popular">Popular</Badge>}

              <h1
                className={`font-display text-[clamp(2.25rem,4.6vw,3.25rem)] leading-[1.16] font-bold text-black ${
                  course.popular ? "mt-8" : ""
                }`}
              >
                {course.title}
              </h1>

              {course.summary && (
                <p className="mt-6 max-w-[420px] text-[17px] leading-[31px] text-neutral-500">
                  {course.summary}
                </p>
              )}

              <ul className="mt-11 flex flex-wrap items-center gap-x-9 gap-y-3 text-[14px] leading-[20px] text-neutral-700">
                {course.level && (
                  <li className="inline-flex items-center gap-2">
                    <ChartNoAxesColumn size={16} aria-hidden="true" className="text-neutral-500" />
                    {formatLevel(course.level)}
                  </li>
                )}
                <li className="inline-flex items-center gap-2">
                  <Clock size={16} aria-hidden="true" className="text-neutral-500" />
                  {duration}
                </li>
                <li className="inline-flex items-center gap-2">
                  <File size={16} aria-hidden="true" className="text-neutral-500" />
                  {pluralize(moduleCount, "module")}
                </li>
                {typeof course.studentCount === "number" && (
                  <li className="inline-flex items-center gap-2">
                    <Users size={16} aria-hidden="true" className="text-neutral-500" />
                    {formatCount(course.studentCount)} students
                  </li>
                )}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                {resumeHref && (
                  <ButtonLink href={resumeHref} size="xl" className="h-[56px] px-7">
                    Continue Learning
                    <ArrowRight size={18} aria-hidden="true" />
                  </ButtonLink>
                )}
                {/* Presentational, like the header bell (AGENTS §7). `Button`'s tertiary
                    variant appends its own icon, so this one is plain markup. */}
                <button
                  type="button"
                  className="inline-flex h-[56px] items-center gap-3 rounded-md border border-line bg-surface px-6 text-[16px] font-medium text-neutral-900 hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                >
                  <Bookmark size={18} aria-hidden="true" />
                  Bookmark
                </button>
              </div>
            </div>
          </section>

          {/* What you'll learn */}
          {outcomes.length > 0 && (
            <section className={`mt-[52px] p-6 sm:p-7 ${panel}`}>
              <h2 className="font-display text-[24px] leading-[32px] text-black">
                What you&rsquo;ll learn
              </h2>
              <ul className="mt-6 grid gap-5 md:grid-cols-2">
                {outcomes.map((outcome) => {
                  const Icon = outcomeIcons[outcome.icon ?? ""] ?? Sparkles;
                  return (
                    <li
                      key={outcome._key}
                      className="flex flex-col gap-4 rounded-lg border border-line p-6 sm:flex-row sm:gap-7 sm:p-7"
                    >
                      <Icon
                        size={54}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="shrink-0 text-primary-500"
                      />
                      <div className="min-w-0">
                        <h3 className="font-display text-[19px] leading-[26px] text-black">
                          {outcome.title}
                        </h3>
                        <p className="mt-2 text-[15px] leading-[28px] text-neutral-500">
                          {outcome.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Course content */}
          <section className="mt-[52px]">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-[24px] leading-[32px] text-black">
                Course Content
              </h2>
              <p className="text-[13px] leading-[18px] text-neutral-500">
                {pluralize(moduleCount, "module")} &nbsp;•&nbsp; {duration}
              </p>
            </div>

            <div className="mt-5">
              {/* CSS-only disclosure: no JS, and the pill only exists for long courses. */}
              <input
                type="checkbox"
                id="show-all-modules"
                className="peer sr-only"
                defaultChecked={modules.length <= COLLAPSE_AFTER}
              />
              {/* `peer-*` only reaches siblings of the input, so the reveal is driven
                  from the <ol> (a sibling) down into its rows. */}
              <ol className={`overflow-hidden peer-checked:[&>li]:block ${panel}`}>
                {modules.map((module, index) => (
                  <li
                    key={module._key}
                    className={`border-line not-first:border-t ${
                      index >= COLLAPSE_AFTER ? "hidden" : ""
                    }`}
                  >
                    <ModuleRow
                      module={module}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === modules.length - 1}
                    />
                  </li>
                ))}
              </ol>
              {modules.length > COLLAPSE_AFTER && (
                /* A direct sibling of the input, so `peer-*` applies: the hidden
                   checkbox stays the only tab stop and shows its ring on this pill. */
                <label
                  htmlFor="show-all-modules"
                  className="-mt-[22px] mx-auto flex h-[45px] w-fit cursor-pointer items-center gap-3 rounded-md border border-line bg-paper px-6 text-[15px] text-neutral-900 hover:text-primary-500 peer-checked:hidden peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-500"
                >
                  Show all {moduleCount} modules
                  <ChevronDown size={16} aria-hidden="true" />
                </label>
              )}
            </div>
          </section>

          {/* Progress. Presentational until the progress record exists (AGENTS §7). */}
          <CourseProgressBar percentComplete={0} resumeHref={resumeHref} />
        </main>

        <ChartDecoration className="-mt-[86px]" />
      </div>
    </div>
  );
}

type CourseModule = NonNullable<
  NonNullable<Awaited<ReturnType<typeof getCourse>>>["modules"]
>[number];

function ModuleRow({
  module,
  index,
  isFirst,
  isLast,
}: {
  module: CourseModule;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const lessons = module.lessons ?? [];
  return (
    <details className="group">
      <summary className="relative flex cursor-pointer list-none items-center gap-4 px-6 py-4 sm:gap-6 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500 sm:px-7">
        {/* The line threading the numbered circles together, as in the reference. */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-[38px] w-px bg-line sm:left-[42px]",
            isFirst ? "top-1/2" : "top-0",
            isLast ? "bottom-1/2" : "bottom-0",
          )}
        />
        <span
          aria-hidden="true"
          className="relative flex size-[29px] shrink-0 items-center justify-center rounded-full border border-line bg-paper font-display text-[15px] text-neutral-900"
        >
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] leading-[22px] text-black">
            {module.title}
          </span>
          {module.summary && (
            <span className="mt-0.5 block text-[13px] leading-[20px] text-neutral-500">
              {module.summary}
            </span>
          )}
        </span>
        <span className="shrink-0 text-[13px] leading-[18px] text-neutral-500">
          {formatDuration(module.duration)}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="shrink-0 text-neutral-500 transition-transform group-open:rotate-180"
        />
      </summary>

      <ol className="border-t border-line py-2 pr-6 pl-[62px] sm:pr-7 sm:pl-[66px]">
        {lessons.map((lesson, lessonIndex) => {
          const row = (
            <>
              <Play size={14} aria-hidden="true" className="shrink-0 text-primary-500" />
              <span className="w-9 shrink-0 text-neutral-500 tabular-nums">
                {index + 1}.{lessonIndex + 1}
              </span>
              <span className="min-w-0 flex-1 text-neutral-900">{lesson.title}</span>
              {lesson.freePreview && (
                <Badge variant="lesson" className="shrink-0">
                  Free preview
                </Badge>
              )}
              <span className="shrink-0 text-neutral-500">
                {formatDuration(lesson.duration)}
              </span>
            </>
          );
          return (
            <li key={lesson._id}>
              {LESSON_ROUTE_READY ? (
                <Link
                  href={`/lessons/${lesson.slug}`}
                  className={`${lessonRow} hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`}
                >
                  {row}
                </Link>
              ) : (
                <div className={lessonRow}>{row}</div>
              )}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

/**
 * The sticky progress bar. `percentComplete` and `resumeHref` are props so the real
 * Clerk-keyed progress record drops in without touching this markup.
 */
function CourseProgressBar({
  percentComplete,
  resumeHref,
}: {
  percentComplete: number;
  resumeHref: string | null;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(percentComplete)));
  return (
    <div className={`sticky bottom-6 z-10 mt-12 flex flex-col gap-4 p-5 shadow-md sm:flex-row sm:items-center sm:gap-8 ${panel}`}>
      <div className="shrink-0">
        <p className="text-[13px] leading-[18px] text-neutral-500">Your Progress</p>
        <p className="mt-1 text-[15px] leading-[22px] text-neutral-500">
          <span className="font-semibold text-neutral-900">{pct}%</span>{" "}
          {pct === 0 ? "— not started" : "complete"}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Course progress"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 sm:max-w-[283px]"
      >
        <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
      </div>
      {resumeHref && (
        <ButtonLink href={resumeHref} size="xl" className="ml-auto h-[55px] w-full px-7 sm:w-auto">
          Continue Learning
          <ArrowRight size={18} aria-hidden="true" />
        </ButtonLink>
      )}
    </div>
  );
}
