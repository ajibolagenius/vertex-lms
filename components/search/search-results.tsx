"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import posthog from "posthog-js";
import { ResultCard } from "@/components/search/result-card";
import { SearchForm } from "@/components/search/search-form";
import { Select } from "@/components/ui/select";
import { pluralize } from "@/lib/format";
import {
  SORTS,
  SORT_LABELS,
  type SearchResponse,
  type Sort,
} from "@/lib/search/types";

/**
 * The results experience (AGENTS §11): every ranked match, a count, and a sort control.
 * A results page, not a chatbox — the response's `reply` is deliberately not rendered.
 *
 * Client-side because `/api/search` runs an LLM tool loop with `maxDuration = 60`;
 * server-rendering it would block the whole document on that. The URL stays the source
 * of truth, so a results link is shareable and the sort survives a reload.
 *
 * The browser only ever POSTs to our own route — it holds no token and never touches the
 * MCP or the LLM (AGENTS §5).
 */

/**
 * Keyed by `query|sort|attempt`, so status is *derived*: anything whose key is not the
 * current one is still loading. That keeps setState out of the effect body (React would
 * otherwise cascade a render) and means a stale response can never be shown for a newer
 * query.
 */
type Outcome = { key: string; data: SearchResponse | "error" };

function toSort(value: string | null): Sort {
  return SORTS.includes(value as Sort) ? (value as Sort) : "relevance";
}

export function SearchResults() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const query = (params.get("q") ?? "").trim();
  const sort = toSort(params.get("sort"));
  /** Bumped by Retry to re-run the fetch — `router.refresh()` would not, the data is ours. */
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const key = `${query}|${sort}|${attempt}`;

  useEffect(() => {
    if (!query) return;

    // A fast second search cancels the first rather than racing it.
    const controller = new AbortController();

    fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, sort }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        setOutcome({ key, data: (await response.json()) as SearchResponse });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setOutcome({ key, data: "error" });
      });

    return () => controller.abort();
  }, [key, query, sort]);

  const current = outcome?.key === key ? outcome.data : null;
  const status = !query ? "idle" : current === null ? "loading" : current === "error" ? "error" : "done";
  const done = current === "error" ? null : current;

  return (
    <>
      <SearchForm
        id="search-results-query"
        source="results"
        variant="page"
        defaultValue={query}
        // Remounts on a new query so the field shows what the URL says after navigation.
        key={query}
        label="Search courses and lessons"
        className="mt-8 w-full"
      />

      {query && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <p role="status" className="text-data text-ink-muted">
            {done
              ? `${pluralize(done.count, "result")} across ${pluralize(done.courseCount, "course")}`
              : "Searching…"}
          </p>
          <Select
            id="search-sort"
            label="Sort results"
            className="w-[160px]"
            options={SORTS.map((option) => SORT_LABELS[option])}
            value={SORT_LABELS[sort]}
            onChange={(event) => {
              const next =
                SORTS.find((option) => SORT_LABELS[option] === event.target.value) ??
                "relevance";
              posthog.capture("search_sort_changed", { query, sort: next });
              const nextParams = new URLSearchParams({ q: query });
              if (next !== "relevance") nextParams.set("sort", next);
              // `replace`, so sorting does not stack up history entries.
              router.replace(`${pathname}?${nextParams}`);
            }}
          />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {status === "loading" && <Skeletons />}

        {status === "error" && (
          <div className="rounded-md border border-line bg-surface p-6">
            <p className="text-body text-ink">Search is unavailable right now.</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-3 text-body text-accent hover:text-accent-hover"
            >
              Retry
            </button>
          </div>
        )}

        {done?.results.map((result) => (
          <ResultCard
            key={`${result.lessonId}-${result.rank}`}
            result={result}
            query={query}
          />
        ))}
      </div>

      {/* The reference shows this strip under the results as well as in place of them. */}
      {done && <EmptyStrip />}
    </>
  );
}

function Skeletons() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="flex animate-pulse flex-col gap-5 rounded-md border border-line bg-surface p-4 sm:flex-row"
        >
          <div className="aspect-video w-full shrink-0 rounded-sm bg-raised sm:w-[240px]" />
          <div className="flex flex-1 flex-col gap-3 py-1">
            <div className="h-3 w-40 rounded-xs bg-raised" />
            <div className="h-5 w-2/3 rounded-xs bg-raised" />
            <div className="h-3 w-full rounded-xs bg-raised" />
            <div className="mt-auto h-3 w-1/3 rounded-xs bg-raised" />
          </div>
        </div>
      ))}
      <span className="sr-only" role="status">
        Searching…
      </span>
    </>
  );
}

function EmptyStrip() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-raised px-5 py-4">
      <span className="flex items-center gap-3">
        <Search size={18} aria-hidden="true" className="shrink-0 text-ink-muted" />
        <span className="text-body text-ink-muted">
          Not what you were after? Try different keywords, or browse the full catalog.
        </span>
      </span>
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-body text-accent hover:text-accent-hover"
      >
        Browse all courses
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}
