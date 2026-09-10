import { Suspense } from "react";
import type { Metadata } from "next";
import { Shell } from "@/components/shell";
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
    <Shell>
      <header className="border-b border-line pt-12 pb-8">
        <p className="text-meta text-ink-muted">Results</p>
        <h1 className="mt-3 text-title text-ink">
          {query ? <span className="break-words">{query}</span> : "What do you want to learn?"}
        </h1>
      </header>

      <Suspense>
        <SearchResults />
      </Suspense>
    </Shell>
  );
}
