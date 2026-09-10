"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import posthog from "posthog-js";

/**
 * The "Continue: …" affordance on My Learning. Client only so the click is measurable —
 * the href already carries `?t=`, so the lesson page's `lesson_viewed` reports the same
 * second as `resumed_from_seconds`.
 */
export function ResumeLink({
  href,
  title,
  lessonSlug,
  courseSlug,
  positionSeconds,
}: {
  href: string;
  title: string;
  lessonSlug: string;
  courseSlug: string;
  positionSeconds: number;
}) {
  return (
    <Link
      href={href}
      onClick={() =>
        posthog.capture("learning_resumed", {
          course_slug: courseSlug,
          lesson_slug: lessonSlug,
          position_seconds: positionSeconds,
          source: "my_learning",
        })
      }
      className="inline-flex max-w-full items-center gap-2 text-body text-accent hover:text-accent-hover"
    >
      <span className="truncate">Continue: {title}</span>
      <ArrowRight size={16} aria-hidden="true" className="shrink-0" />
    </Link>
  );
}
