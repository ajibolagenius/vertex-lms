import { Suspense } from "react";
import type { Metadata } from "next";
import { ChartDecoration } from "@/components/decor/chart-decoration";
import { SiteHeader } from "@/components/nav/site-header";
import { SearchResults } from "@/components/search/search-results";

export const metadata: Metadata = {
  title: "Search — Vertex",
  description: "Search every course and lesson on Vertex in plain English.",
};

/**
 * The search results page (AGENTS §11) — a full results page, not a widget and not a
 * chatbox. The shell is server-rendered; everything that depends on the query lives in
 * `SearchResults`, which reads it from the URL behind a `<Suspense>` boundary (that is
 * what `useSearchParams` needs in a prerendered segment).
 */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  return (
    <div className="flex-1 bg-hatch px-0 sm:px-8">
      <div className="mx-auto w-full max-w-[1440px] border-x border-line bg-paper">
        <SiteHeader />

        <main className="px-6 pt-14 pb-8 sm:px-12">
          <div className="text-center">
            <span className="inline-flex h-8 items-center rounded-md bg-primary-100 px-3 text-[12px] font-semibold tracking-[0.16em] text-primary-500 uppercase">
              Search Results
            </span>

            <h1 className="mt-6 font-display text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.2] text-black">
              {query ? (
                <>
                  Results for <span className="text-primary-500">&ldquo;{query}&rdquo;</span>
                </>
              ) : (
                "What do you want to learn?"
              )}
            </h1>
          </div>

          <Suspense>
            <SearchResults />
          </Suspense>
        </main>

        <ChartDecoration className="mt-8" />
      </div>
    </div>
  );
}
