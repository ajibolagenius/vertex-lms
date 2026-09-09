"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { SearchInput, type SearchInputVariant } from "@/components/ui/search-input";
import { MAX_QUERY_LENGTH } from "@/lib/search/types";

/**
 * The field that starts a search. Navigating is all it does — the query goes into the
 * URL, and `SearchResults` reads it from there, so a results URL is shareable and
 * survives a reload.
 *
 * The ⌘ K hint the design draws is wired here: it focuses the field.
 */
export function SearchForm({
  id,
  defaultValue = "",
  variant = "md",
  label = "Search",
  placeholder,
  className,
}: {
  id: string;
  defaultValue?: string;
  variant?: SearchInputVariant;
  label?: string;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      input.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <form
      role="search"
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        // Capped here too, so the route's 400 is a backstop and not the UX.
        const query = (input.current?.value ?? "").trim().slice(0, MAX_QUERY_LENGTH);
        if (!query) return;
        posthog.capture("search_initiated", { query });
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }}
    >
      <SearchInput
        ref={input}
        id={id}
        name="q"
        variant={variant}
        label={label}
        // Spread only when set, or `undefined` would override SearchInput's own default.
        {...(placeholder ? { placeholder } : {})}
        defaultValue={defaultValue}
        maxLength={MAX_QUERY_LENGTH}
      />
    </form>
  );
}
