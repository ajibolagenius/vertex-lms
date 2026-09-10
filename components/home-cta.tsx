"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { SearchForm } from "@/components/search/search-form";

/**
 * The home hero's field plus a few starting points. The examples are static strings, not
 * generated from the catalog — they are prompts, and a wrong one costs nothing but a
 * search that returns an empty state.
 */
const EXAMPLES = [
  "how caching works in server components",
  "streaming a model response",
  "when to use a docker volume",
  "grouping data with pandas",
];

export function HomeCta() {
  return (
    <>
      <SearchForm
        id="home-search"
        source="home"
        variant="hero"
        label="Ask anything about your learning"
        placeholder="Ask anything about your learning…"
        className="mt-10 max-w-[720px]"
      />

      <ul className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <li key={example}>
            <Link
              href={`/search?q=${encodeURIComponent(example)}`}
              onClick={() => posthog.capture("search_example_clicked", { query: example })}
              className="inline-flex rounded-xs border border-line px-2.5 py-1.5 text-data text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              {example}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
