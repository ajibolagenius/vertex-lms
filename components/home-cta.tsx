"use client";

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SearchForm } from "@/components/search/search-form";
import posthog from "posthog-js";

export function HomeCta() {
  return (
    <>
      {/* Wrap in a span so we can capture the click without modifying ButtonLink's props */}
      <span onClick={() => posthog.capture("explore_courses_clicked")} className="mt-10 inline-block">
        <ButtonLink href="/courses" size="xl" className="px-8">
          Explore Courses
          <ArrowRight size={20} aria-hidden="true" />
        </ButtonLink>
      </span>

      {/* Live now: submitting navigates to /search, where the results page reads the
          query from the URL. `SearchForm` captures `search_initiated` itself. */}
      <SearchForm
        id="home-search"
        source="home"
        variant="hero"
        label="Ask anything about your learning"
        placeholder="Ask anything about your learning..."
        className="mx-auto mt-10 max-w-[748px] text-left"
      />
    </>
  );
}
