import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Lightbulb,
  SquareArrowOutUpRight,
} from "lucide-react";
import { LessonViewTracker, MarkCompleteButton } from "@/components/course-actions";
import { LessonPlayerProvider } from "@/components/lesson/player-context";
import { LessonSidebar } from "@/components/lesson/lesson-sidebar";
import { LessonTabs } from "@/components/lesson/lesson-tabs";
import { LessonRail } from "@/components/lesson/lesson-rail";
import { LessonVideo } from "@/components/lesson/video-player";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Shell } from "@/components/shell";
import { formatCount, formatDuration, formatLevel } from "@/lib/format";
import { youtubeId } from "@/lib/video";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  LESSON_BY_SLUG_QUERY,
  LESSON_SLUGS_QUERY,
  VIDEO_BY_URL_QUERY,
} from "@/sanity/lib/queries";

type LessonDoc = NonNullable<Awaited<ReturnType<typeof getLesson>>>;
type NotesBlock = NonNullable<LessonDoc["notes"]>[number];

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
 * The notes panel renders `lesson.notes` in full. The serializers cover everything
 * `blockContent` allows — normal/h2/h3/blockquote styles, bullet and numbered lists, the
 * strong/em/code decorators and the link annotation — so an author cannot write something
 * the page silently drops.
 *
 * The lesson title is the page's h1, so an authored heading renders beneath it.
 */
const notesComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mt-4 text-body-lg text-ink-muted first:mt-0">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mt-8 text-heading-2 text-ink first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 text-heading-3 text-ink first:mt-0">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-5 border-l-2 border-accent pl-4 text-body-lg text-ink-muted first:mt-0">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 list-disc space-y-2 pl-5 text-body-lg text-ink-muted marker:text-ink-disabled">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-body-lg text-ink-muted marker:text-ink-disabled">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded-xs bg-raised px-1.5 py-0.5 text-data text-ink">{children}</code>
    ),
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline underline-offset-2 hover:text-accent-hover"
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

  /**
   * The ingested transcript for this lesson's video, joined on the URL (AGENTS §9).
   * A lesson whose video has not been ingested simply has no rail.
   */
  const video = lesson.videoUrl
    ? await sanityFetch({
        query: VIDEO_BY_URL_QUERY,
        params: { url: lesson.videoUrl },
        tags: ["video"],
      })
    : null;

  /* A lesson stores no parent (AGENTS §8), so its position comes from the course tree. */
  const flat = modules.flatMap((module, moduleIndex) =>
    (module.lessons ?? []).map((item, lessonIndex) => ({ item, moduleIndex, lessonIndex })),
  );
  const position = flat.findIndex(({ item }) => item._id === lesson._id);
  const { moduleIndex, lessonIndex } = flat[position] ?? { moduleIndex: 0, lessonIndex: 0 };
  const previous = position > 0 ? flat[position - 1]?.item : undefined;
  const next = position >= 0 ? flat[position + 1]?.item : undefined;

  const { lede, body } = splitNotes(lesson.notes);
  const overviewBlocks = body.filter(
    (block: NotesBlock) => block._type === "block" && block.style === "normal" && !block.listItem,
  );
  const keyPoints = (lesson.keyPoints ?? []).filter(
    (keyPoint): keyPoint is string => Boolean(keyPoint),
  );
  // A resource with no url has nothing to open, so it never becomes a card — this
  // also keeps the Resources heading hidden when none of them are linkable.
  const resources = (lesson.resources ?? []).filter(
    (r): r is typeof r & { url: string } => Boolean(r.url),
  );

  const meta = [
    `Lesson ${moduleIndex + 1}.${lessonIndex + 1}`,
    formatDuration(lesson.duration),
    course?.level ? formatLevel(course.level) : null,
    typeof lesson.studentCount === "number"
      ? `${formatCount(lesson.studentCount)} students`
      : null,
    lesson.freePreview ? "Free preview" : null,
  ].filter(Boolean) as string[];

  return (
    <Shell bleed>
      {/* Reads `?t=` to record where the learner left off, so it needs a boundary. */}
      <Suspense fallback={null}>
        <LessonViewTracker
          lessonId={lesson._id}
          lessonSlug={slug}
          lessonTitle={lesson.title ?? ""}
          courseSlug={course?.slug ?? undefined}
          moduleIndex={moduleIndex}
        />
      </Suspense>

      {/* The workspace: course tree, lesson, transcript rail. Ordered so a narrow screen
          gets the lesson first, then the transcript, then the tree. The row wraps, so
          between lg and xl the full-width rail drops under the other two and only becomes
          a third column once there is room for three. */}
      <LessonPlayerProvider>
        <div className="mx-auto flex w-full max-w-[1600px] flex-col lg:flex-row lg:flex-wrap">
          {course && (
            <LessonSidebar
              course={course}
              currentLessonId={lesson._id}
              currentModuleIndex={moduleIndex}
            />
          )}

          <article className="order-1 min-w-0 flex-1 px-5 pt-6 pb-16 sm:px-8 lg:order-2">
            <Breadcrumbs
              items={[
                { label: "Courses", href: "/courses" },
                ...(course
                  ? [
                      {
                        label: course.title ?? "Course",
                        href: course.slug ? `/courses/${course.slug}` : undefined,
                      },
                    ]
                  : []),
                { label: lesson.title ?? "Lesson" },
              ]}
            />

            <div className="mt-6 max-w-[880px]">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-data text-ink-muted">
                {meta.map((item, index) => (
                  <span key={item} className="flex items-center gap-2">
                    {index > 0 && (
                      <span aria-hidden="true" className="text-ink-disabled">
                        ·
                      </span>
                    )}
                    {item}
                  </span>
                ))}
              </p>

              <h1 className="mt-3 text-title text-ink">{lesson.title}</h1>
              {lede && <p className="mt-4 text-body-lg text-ink-muted">{lede}</p>}
            </div>

            <div className="mt-7 max-w-[1000px]">
              {/* `?t=` is read inside the player, so this route still prerenders. */}
              <Suspense
                fallback={<div className="aspect-video w-full rounded-md bg-raised" />}
              >
                <LessonVideo
                  videoId={youtubeId(lesson.videoUrl)}
                  title={lesson.title ?? "Lesson video"}
                  lessonId={lesson._id}
                  lessonSlug={slug}
                  courseSlug={course?.slug ?? undefined}
                  poster={
                    lesson.thumbnail?.asset
                      ? urlFor(lesson.thumbnail).width(1216).height(684).fit("crop").url()
                      : null
                  }
                  posterAlt={lesson.thumbnail?.alt ?? ""}
                />
              </Suspense>
            </div>

            <div className="mt-10 max-w-[880px]">
              <LessonTabs
                content={
                  <div className="pt-8">
                    {overviewBlocks.length > 0 && (
                      <PortableText value={overviewBlocks} components={notesComponents} />
                    )}

                    {keyPoints.length > 0 && (
                      <section className="mt-10 border-t border-line pt-6">
                        <h2 className="text-meta text-ink-muted">In this lesson you will</h2>
                        <ul className="mt-4 space-y-2.5">
                          {keyPoints.map((keyPoint) => (
                            <li key={keyPoint} className="flex items-start gap-3 text-body text-ink">
                              <Check
                                size={15}
                                aria-hidden="true"
                                className="mt-1 shrink-0 text-accent"
                              />
                              <span>{keyPoint}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {lesson.proTip && (
                      <div className="mt-8 flex gap-3 rounded-md border border-line bg-raised p-5">
                        <Lightbulb size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
                        <div className="min-w-0">
                          <h3 className="text-meta text-ink-muted">Pro tip</h3>
                          <p className="mt-2 text-body text-ink">{lesson.proTip}</p>
                        </div>
                      </div>
                    )}

                    {resources.length > 0 && (
                      <section className="mt-10 border-t border-line pt-6">
                        <h2 className="text-meta text-ink-muted">Resources</h2>
                        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
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

            <nav
              aria-label="Lesson navigation"
              className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6"
            >
              <MarkCompleteButton
                lessonId={lesson._id}
                lessonSlug={slug}
                courseSlug={course?.slug ?? undefined}
                moduleIndex={moduleIndex}
              />

              <span className="ml-auto flex flex-wrap items-center gap-3">
                {previous?.slug && (
                  <Link
                    href={`/lessons/${previous.slug}`}
                    className="inline-flex h-11 max-w-[240px] items-center gap-2 rounded-sm border border-line px-4 text-body text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                  >
                    <ArrowLeft size={15} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">{previous.title}</span>
                  </Link>
                )}
                {next?.slug && (
                  <Link
                    href={`/lessons/${next.slug}`}
                    className="inline-flex h-11 max-w-[280px] items-center gap-2 rounded-sm bg-accent px-4 text-[15px] font-medium text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    <span className="truncate">{next.title}</span>
                    <ArrowRight size={15} aria-hidden="true" className="shrink-0" />
                  </Link>
                )}
              </span>
            </nav>
          </article>

          <aside className="order-2 flex max-h-[70vh] w-full shrink-0 flex-col border-t border-line lg:order-3 xl:sticky xl:top-14 xl:max-h-[calc(100vh-3.5rem)] xl:w-[380px] xl:border-t-0 xl:border-l">
            <LessonRail
              lessonId={lesson._id}
              lessonSlug={slug}
              courseSlug={course?.slug ?? undefined}
              chapters={video?.chapters ?? []}
              chunks={video?.chunks ?? []}
              quiz={lesson.quiz ?? []}
            />
          </aside>
        </div>
      </LessonPlayerProvider>
    </Shell>
  );
}

/** The GitHub mark, which lucide does not ship. */
function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-current">
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
      className="flex h-full items-start gap-3 rounded-sm border border-line p-4 transition-colors hover:border-line-strong"
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-ink-muted">
        {isRepo ? <GithubMark /> : <FileText size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body text-ink">{title}</span>
        {description && (
          <span className="mt-1 block text-small text-ink-muted">{description}</span>
        )}
      </span>
      <SquareArrowOutUpRight
        size={14}
        aria-hidden="true"
        className="mt-1 shrink-0 text-ink-disabled"
      />
    </a>
  );
}
