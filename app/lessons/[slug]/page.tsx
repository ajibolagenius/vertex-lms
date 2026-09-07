import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import {
  ArrowLeft,
  ArrowRight,
  ChartNoAxesColumn,
  Clock,
  FileText,
  Lightbulb,
  SquareArrowOutUpRight,
  Users,
} from "lucide-react";
import { BookmarkIconButton, LessonViewTracker } from "@/components/course-actions";
import { LessonSidebar } from "@/components/lesson/lesson-sidebar";
import { LessonTabs } from "@/components/lesson/lesson-tabs";
import { LessonVideo } from "@/components/lesson/video-player";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { SiteHeader } from "@/components/nav/site-header";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatLevel } from "@/lib/format";
import { youtubeId } from "@/lib/video";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/fetch";
import { LESSON_BY_SLUG_QUERY, LESSON_SLUGS_QUERY } from "@/sanity/lib/queries";

type LessonDoc = NonNullable<Awaited<ReturnType<typeof getLesson>>>;
type NotesBlock = NonNullable<LessonDoc["notes"]>[number];

/**
 * Progress is not implemented yet (AGENTS §7). The sidebar derives its ticks and
 * percentage from this list, so the real Clerk-keyed record drops in here.
 */
const COMPLETED_LESSON_IDS: string[] = [];

async function getLesson(slug: string) {
  return sanityFetch({ query: LESSON_BY_SLUG_QUERY, params: { slug } });
}

export async function generateStaticParams() {
  const slugs = await sanityFetch({ query: LESSON_SLUGS_QUERY, fresh: true });
  return slugs.filter((slug): slug is string => Boolean(slug)).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/lessons/[slug]">) {
  const { slug } = await params;
  const lesson = await getLesson(slug);
  if (!lesson) return {};
  return {
    title: `${lesson.title} — Vertex`,
    description: splitNotes(lesson.notes).lede || undefined,
  };
}

/**
 * The first notes paragraph becomes the lede under the title, so the panel
 * renders everything except that one block — found by position rather than
 * assumed to be index 0, or notes that open with a heading would lose it.
 */
function splitNotes(notes: LessonDoc["notes"]): { lede: string; body: NotesBlock[] } {
  const blocks = notes ?? [];
  const index = blocks.findIndex(
    (block: NotesBlock) =>
      block._type === "block" && block.style === "normal" && !block.listItem,
  );
  if (index < 0) return { lede: "", body: blocks };
  return {
    lede: blocks[index].children?.map((child) => child.text).join("") ?? "",
    body: blocks.filter((_, position) => position !== index),
  };
}

/**
 * The lesson content panel renders `lesson.notes` in full. The serializers cover everything
 * `blockContent` allows — normal/h2/h3/blockquote styles, bullet and numbered
 * lists, the strong/em/code decorators and the link annotation — so an author
 * cannot write something the page silently drops.
 *
 * The lesson title is the page's h1, so an authored heading renders at its own
 * level beneath it.
 */
const notesComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mt-5 text-[15px] leading-[23px] text-neutral-500 first:mt-0">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mt-7 font-display text-[20px] leading-[28px] font-bold text-black first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 text-[15px] leading-[22px] font-semibold text-neutral-900 first:mt-0">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-5 border-l-2 border-primary-300 pl-4 text-[15px] leading-[23px] text-neutral-500 italic first:mt-0">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-[23px] text-neutral-500 marker:text-primary-500">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] leading-[23px] text-neutral-500 marker:text-primary-500">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-neutral-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded-xs bg-neutral-100 px-1 py-0.5 font-mono text-[13px] text-neutral-900">
        {children}
      </code>
    ),
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-500 underline underline-offset-2 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        {children}
      </a>
    ),
  },
};

export default async function LessonPage({ params }: PageProps<"/lessons/[slug]">) {
  const { slug } = await params;
  const lesson = await getLesson(slug);
  if (!lesson) notFound();

  const course = lesson.course;
  const modules = course?.modules ?? [];

  /* A lesson stores no parent (AGENTS §8), so its position comes from the course tree. */
  const flat = modules.flatMap((module, moduleIndex) =>
    (module.lessons ?? []).map((item, lessonIndex) => ({ item, moduleIndex, lessonIndex })),
  );
  const position = flat.findIndex(({ item }) => item._id === lesson._id);
  const { moduleIndex, lessonIndex } = flat[position] ?? { moduleIndex: 0, lessonIndex: 0 };
  const previous = position > 0 ? flat[position - 1]?.item : undefined;
  const next = position >= 0 ? flat[position + 1]?.item : undefined;

  const { lede, body } = splitNotes(lesson.notes);
  // A resource with no url has nothing to open, so it never becomes a card — this
  // also keeps the Resources heading hidden when none of them are linkable.
  const resources = (lesson.resources ?? []).filter(
    (r): r is typeof r & { url: string } => Boolean(r.url),
  );

  return (
    <div className="flex-1 bg-hatch px-0 sm:px-8">
      <div className="mx-auto w-full max-w-[1440px] border-x border-line bg-paper">
        <SiteHeader />
        <LessonViewTracker
          lessonSlug={slug}
          lessonTitle={lesson.title ?? ""}
          courseSlug={course?.slug ?? undefined}
          moduleIndex={moduleIndex}
        />

        {/* Reversed on small screens so the video comes before the course tree. */}
        <div className="flex flex-col-reverse lg:flex-row">
          {course && (
            <LessonSidebar
              course={course}
              currentLessonId={lesson._id}
              currentModuleIndex={moduleIndex}
              completedLessonIds={COMPLETED_LESSON_IDS}
            />
          )}

          <main className="min-w-0 flex-1 px-6 pt-9 pb-12 sm:px-9">
            <Breadcrumbs
              items={[
                { label: "All Courses", href: "/courses" },
                ...(course
                  ? [
                      {
                        label: course.title ?? "Course",
                        href: course.slug ? `/courses/${course.slug}` : undefined,
                      },
                    ]
                  : []),
                ...(modules[moduleIndex]?.title
                  ? [{ label: modules[moduleIndex].title as string }]
                  : []),
                { label: lesson.title ?? "Lesson" },
              ]}
            />

            <div className="mt-8 flex items-start justify-between gap-6">
              <div className="min-w-0">
                <Badge variant="video">
                  Lesson {moduleIndex + 1}.{lessonIndex + 1}
                </Badge>
                <h1 className="mt-5 font-display text-[clamp(2rem,5vw,52px)] leading-[1.15] font-bold text-black">
                  {lesson.title}
                </h1>
              </div>
              <BookmarkIconButton label={lesson.title ?? "this lesson"} />
            </div>

            <p className="mt-5 max-w-[460px] text-[17px] leading-[26px] text-neutral-500">
              {lede}
            </p>

            <ul className="mt-8 flex flex-wrap items-center gap-x-9 gap-y-3 text-[14px] leading-[20px] text-neutral-700">
              <li className="inline-flex items-center gap-2">
                <Clock size={16} aria-hidden="true" className="text-primary-500" />
                {formatDuration(lesson.duration)}
              </li>
              {course?.level && (
                <li className="inline-flex items-center gap-2">
                  <ChartNoAxesColumn size={16} aria-hidden="true" className="text-primary-500" />
                  {formatLevel(course.level)}
                </li>
              )}
              {typeof lesson.studentCount === "number" && (
                <li className="inline-flex items-center gap-2">
                  <Users size={16} aria-hidden="true" className="text-primary-500" />
                  {lesson.studentCount.toLocaleString("en-US")} students
                </li>
              )}
            </ul>

            <div className="mt-7">
              {/* `?t=` is read inside the player, so this route still prerenders. */}
              <Suspense
                fallback={<div className="aspect-video w-full rounded-md bg-neutral-900" />}
              >
                <LessonVideo
                  videoId={youtubeId(lesson.videoUrl)}
                  title={lesson.title ?? "Lesson video"}
                  lessonSlug={slug}
                  poster={
                    lesson.thumbnail?.asset
                      ? urlFor(lesson.thumbnail).width(1216).height(684).fit("crop").url()
                      : null
                  }
                  posterAlt={lesson.thumbnail?.alt ?? ""}
                />
              </Suspense>
            </div>

            <div className="mt-10 px-4">
              <LessonTabs
                content={
                  <div className="pt-8">
                    {body.length > 0 && (
                      <section>
                        <PortableText value={body} components={notesComponents} />
                      </section>
                    )}

                    {lesson.proTip && (
                      <div className="mt-8 flex gap-4 rounded-md bg-primary-100 px-6 py-5">
                        <Lightbulb
                          size={22}
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-primary-500"
                        />
                        <div className="min-w-0">
                          <h3 className="font-display text-[16px] leading-[24px] font-bold text-black">
                            Pro Tip
                          </h3>
                          <p className="mt-1 text-[15px] leading-[23px] text-neutral-500">
                            {lesson.proTip}
                          </p>
                        </div>
                      </div>
                    )}

                    {resources.length > 0 && (
                      <section className="mt-8 border-t border-line pt-8">
                        <h2 className="font-display text-[20px] leading-[28px] font-bold text-black">
                          Resources
                        </h2>
                        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {resources.map((resource) => (
                            <li key={resource._key}>
                              <ResourceLink
                                title={resource.title ?? ""}
                                description={resource.description ?? ""}
                                url={resource.url}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                }
              />
            </div>
          </main>
        </div>

        <nav
          aria-label="Lesson navigation"
          className="flex flex-wrap items-center gap-4 border-t border-line px-6 py-[18px] sm:px-8"
        >
          {previous?.slug && (
            <>
              <Link
                href={`/lessons/${previous.slug}`}
                className="inline-flex h-14 items-center gap-3 rounded-md border border-line bg-surface px-6 text-[15px] leading-[22px] font-semibold text-neutral-900 hover:bg-primary-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              >
                <ArrowLeft size={18} aria-hidden="true" />
                Previous Lesson
              </Link>
              <p className="min-w-0 text-[14px] leading-[22px] text-neutral-500">
                <span className="block truncate text-neutral-700">{previous.title}</span>
                {formatDuration(previous.duration)}
              </p>
            </>
          )}

          {next?.slug && (
            <>
              <p className="ml-auto min-w-0 text-right text-[14px] leading-[22px] text-neutral-500">
                <span className="block truncate text-neutral-700">{next.title}</span>
                {formatDuration(next.duration)}
              </p>
              <Link
                href={`/lessons/${next.slug}`}
                className="inline-flex h-14 items-center gap-3 rounded-md bg-primary-500 px-7 text-[15px] leading-[22px] font-semibold text-white hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              >
                Next Lesson
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}

/** The GitHub mark, which lucide does not ship. */
function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-5 fill-current">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function ResourceLink({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  const isRepo = url.includes("github.com");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full flex-col gap-3 rounded-md border border-line p-4 hover:border-primary-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
    >
      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-100 ${
            isRepo ? "text-neutral-900" : "text-primary-500"
          }`}
        >
          {isRepo ? <GithubMark /> : <FileText size={16} />}
        </span>
        <span className="min-w-0 text-[14px] leading-[20px] font-semibold text-neutral-900">
          {title}
        </span>
      </span>
      <span className="flex items-end justify-between gap-3">
        <span className="min-w-0 text-[13px] leading-[20px] text-neutral-500">{description}</span>
        <SquareArrowOutUpRight
          size={16}
          aria-hidden="true"
          className="mb-0.5 shrink-0 text-primary-500"
        />
      </span>
    </a>
  );
}
