"use client";

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
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

      <SearchInput
        id="home-search"
        variant="hero"
        label="Ask anything about your learning"
        placeholder="Ask anything about your learning..."
        readOnly
        className="mx-auto mt-10 max-w-[748px] text-left"
        onClick={() => posthog.capture("search_initiated")}
      />
    </>
  );
}
