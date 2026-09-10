import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Bookmark, Sparkles } from "lucide-react";

import { ViewTracker } from "@/components/analytics/view-tracker";
import { CreateCollectionModal } from "@/components/collections/create-collection-modal";
import { Shell } from "@/components/shell";
import { formatDuration, pluralize } from "@/lib/format";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  COLLECTIONS_BY_OWNER_QUERY,
  CURATED_COLLECTIONS_QUERY,
} from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Collections — Vertex",
  description: "Your saved collections and curated learning paths.",
};

export default async function CollectionsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [personalCollections, curatedCollections] = await Promise.all([
    sanityFetch({
      query: COLLECTIONS_BY_OWNER_QUERY,
      params: { userId },
      fresh: true,
      revalidate: 0,
    }),
    sanityFetch({
      query: CURATED_COLLECTIONS_QUERY,
      fresh: true,
      revalidate: 60,
    }),
  ]);

  return (
    <Shell>
      <ViewTracker
        event="collections_viewed"
        properties={{
          personal_count: personalCollections.length,
          curated_count: curatedCollections.length,
        }}
      />

      <header className="flex flex-wrap items-baseline justify-between gap-4 pt-12">
        <div>
          <p className="text-meta text-ink-muted">Your library</p>
          <h1 className="mt-3 text-title text-ink">Collections</h1>
          <p className="mt-2 text-body text-ink-muted">
            Organize lessons into custom study lists, or explore curated learning paths.
          </p>
        </div>
        <CreateCollectionModal />
      </header>

      {/* 1. Personal collections */}
      <section className="mt-12">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <h2 className="text-heading-2 text-ink">Your collections</h2>
          <span className="text-data text-ink-muted">
            {pluralize(personalCollections.length, "collection")}
          </span>
        </div>

        {personalCollections.length === 0 ? (
          <div className="mt-8 rounded-md border border-line bg-surface p-8 text-center max-w-xl mx-auto">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-raised text-ink-muted">
              <Bookmark size={20} />
            </div>
            <h3 className="mt-4 text-heading-3 text-ink">No collections yet</h3>
            <p className="mt-2 text-body text-ink-muted">
              Save lessons while browsing or searching, or create your first collection above to start organizing topics you want to master.
            </p>
            <div className="mt-6">
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-body text-accent hover:text-accent-hover"
              >
                Browse course catalog
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {personalCollections.map((col) => {
              const count = col.lessonCount ?? 0;
              const duration = col.duration ?? 0;
              return (
                <Link
                  key={col._id}
                  href={`/collections/${col.slug}`}
                  className="group flex flex-col justify-between rounded-md border border-line bg-surface p-5 transition-colors hover:border-line-strong"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-xs bg-accent-soft px-2 py-0.5 text-meta text-accent">
                        Personal
                      </span>
                      <ArrowRight
                        size={15}
                        className="text-ink-disabled group-hover:text-ink transition-colors"
                      />
                    </div>
                    <h3 className="mt-3 text-heading-3 text-ink group-hover:text-accent transition-colors">
                      {col.title}
                    </h3>
                    {col.description && (
                      <p className="mt-2 line-clamp-2 text-body text-ink-muted">
                        {col.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-data text-ink-muted">
                    <span>{pluralize(count, "lesson")}</span>
                    {duration > 0 && <span>{formatDuration(duration)}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Curated learning paths */}
      {curatedCollections.length > 0 && (
        <section className="mt-16 pt-10 border-t border-line">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <h2 className="text-heading-2 text-ink">Curated learning paths</h2>
              </div>
              <p className="mt-1 text-body text-ink-muted">
                Handcrafted sequences designed by instructors.
              </p>
            </div>
            <span className="text-data text-ink-muted">
              {pluralize(curatedCollections.length, "path")}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {curatedCollections.map((curated) => {
              const count = curated.lessonCount ?? 0;
              const duration = curated.duration ?? 0;
              return (
                <Link
                  key={curated._id}
                  href={`/collections/${curated.slug}`}
                  className="group flex flex-col justify-between rounded-md border border-line bg-surface p-5 transition-colors hover:border-line-strong"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-xs bg-raised px-2 py-0.5 text-meta text-ink-muted">
                        Curated
                      </span>
                      <ArrowRight
                        size={15}
                        className="text-ink-disabled group-hover:text-ink transition-colors"
                      />
                    </div>
                    <h3 className="mt-3 text-heading-3 text-ink group-hover:text-accent transition-colors">
                      {curated.title}
                    </h3>
                    {curated.description && (
                      <p className="mt-2 line-clamp-2 text-body text-ink-muted">
                        {curated.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-data text-ink-muted">
                    <span>{pluralize(count, "lesson")}</span>
                    {duration > 0 && <span>{formatDuration(duration)}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </Shell>
  );
}
