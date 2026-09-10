import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Bookmark, Clock, Play } from "lucide-react";

import { ViewTracker } from "@/components/analytics/view-tracker";
import {
  DeleteCollectionButton,
  RemoveLessonButton,
} from "@/components/collections/collection-actions";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Shell } from "@/components/shell";
import { formatDuration, pluralize } from "@/lib/format";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  COLLECTION_BY_SLUG_QUERY,
  COLLECTION_SLUGS_QUERY,
} from "@/sanity/lib/queries";

export async function generateStaticParams() {
  try {
    const slugs = await sanityFetch({ query: COLLECTION_SLUGS_QUERY, fresh: true });
    return slugs.filter((slug): slug is string => Boolean(slug)).map((slug) => ({ slug }));
  } catch (err) {
    console.warn("generateStaticParams: failed to fetch collection slugs", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const collection = await sanityFetch({
    query: COLLECTION_BY_SLUG_QUERY,
    params: { slug },
  });
  if (!collection) return {};
  return {
    title: `${collection.title} — Vertex`,
    description: collection.description || "Collection of lessons on Vertex.",
  };
}

export default async function CollectionDetailPage({
  params,
}: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const collection = await sanityFetch({
    query: COLLECTION_BY_SLUG_QUERY,
    params: { slug },
    fresh: true,
  });

  if (!collection) notFound();

  // If this is a personal collection, ensure the user is the owner
  const isPersonal = Boolean(collection.owner);
  const { userId } = await auth();

  if (isPersonal) {
    if (!userId) redirect("/sign-in");
    if (userId !== collection.owner) notFound();
  }

  const lessons = collection.lessons ?? [];
  const lessonCount = collection.lessonCount ?? lessons.length;
  const duration = collection.duration ?? 0;

  return (
    <Shell>
      <ViewTracker
        event="collection_detail_viewed"
        properties={{
          collection_id: collection._id,
          title: collection.title,
          is_personal: isPersonal,
          lesson_count: lessonCount,
        }}
      />

      <div className="pt-8">
        <Breadcrumbs
          items={[
            { label: "Collections", href: "/collections" },
            { label: collection.title ?? "Collection" },
          ]}
        />
      </div>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-6 pb-8 border-b border-line">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span
              className={
                isPersonal
                  ? "rounded-xs bg-accent-soft px-2 py-0.5 text-meta text-accent"
                  : "rounded-xs bg-raised px-2 py-0.5 text-meta text-ink-muted"
              }
            >
              {isPersonal ? "Personal collection" : "Curated learning path"}
            </span>
          </div>

          <h1 className="mt-3 text-title text-ink">{collection.title}</h1>
          {collection.description && (
            <p className="mt-3 text-body-lg text-ink-muted">{collection.description}</p>
          )}

          <div className="mt-4 flex items-center gap-4 text-data text-ink-muted">
            <span>{pluralize(lessonCount, "lesson")}</span>
            {duration > 0 && (
              <>
                <span aria-hidden="true" className="text-ink-disabled">
                  ·
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} aria-hidden="true" />
                  {formatDuration(duration)}
                </span>
              </>
            )}
          </div>
        </div>

        {isPersonal && (
          <div className="flex items-center gap-3">
            <DeleteCollectionButton
              collectionId={collection._id}
              collectionTitle={collection.title ?? ""}
            />
          </div>
        )}
      </header>

      {/* Lesson list */}
      <section className="mt-8">
        {lessons.length === 0 ? (
          <div className="rounded-md border border-line bg-surface p-12 text-center max-w-lg mx-auto">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-raised text-ink-muted">
              <Bookmark size={20} />
            </div>
            <h2 className="mt-4 text-heading-3 text-ink">No lessons saved yet</h2>
            <p className="mt-2 text-body text-ink-muted">
              Use the &quot;Save&quot; button on lesson pages or search result cards to add lessons to this collection.
            </p>
            <div className="mt-6">
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-body text-accent hover:text-accent-hover"
              >
                Explore courses
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-line rounded-md border border-line bg-surface overflow-hidden">
            {lessons.map((lesson, idx) => {
              const course = lesson.course;
              const coverUrl = course?.coverImage
                ? urlFor(course.coverImage).width(80).height(80).fit("crop").url()
                : null;

              return (
                <div
                  key={lesson._id}
                  className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-raised/40 sm:p-5"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-6 text-data text-ink-disabled font-mono shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    {coverUrl ? (
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xs bg-raised hidden sm:block">
                        <Image
                          src={coverUrl}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-12 shrink-0 rounded-xs bg-raised hidden sm:flex items-center justify-center text-ink-muted">
                        <Play size={16} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {course?.title && (
                          <span className="truncate text-data text-ink-muted">
                            {course.title}
                          </span>
                        )}
                        {lesson.freePreview && (
                          <span className="rounded-xs bg-raised px-1.5 py-0.5 text-meta text-ink-muted">
                            Free preview
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/lessons/${lesson.slug}`}
                        className="mt-0.5 block truncate text-body font-medium text-ink group-hover:text-accent transition-colors"
                      >
                        {lesson.title}
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                    {lesson.duration && (
                      <span className="text-data text-ink-muted">
                        {formatDuration(lesson.duration)}
                      </span>
                    )}

                    <Link
                      href={`/lessons/${lesson.slug}`}
                      className="inline-flex h-8 items-center gap-1 rounded-sm border border-line px-3 text-data text-ink-muted hover:border-line-strong hover:text-ink transition-colors"
                    >
                      <span>Start</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </Link>

                    {isPersonal && (
                      <RemoveLessonButton
                        collectionId={collection._id}
                        lessonId={lesson._id}
                        lessonTitle={lesson.title ?? ""}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </Shell>
  );
}
