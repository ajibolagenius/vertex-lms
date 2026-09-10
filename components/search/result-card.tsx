"use client";

import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import { ArrowUpRight, FileText, Play } from "lucide-react";
import { formatTimestamp } from "@/lib/format";
import type { SearchResult } from "@/lib/search/types";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import { SaveButton } from "@/components/collections/save-button";

/**
 * One search result, in the two kinds the product returns (AGENTS §11): a video moment
 * and a lesson. They share the whole right-hand column and differ in the left panel, the
 * hue and the action, so this is one component with a branch rather than two files.
 *
 * Every value comes from the response, which the route grounded against Sanity — nothing
 * here is derived, defaulted or invented client-side. In particular the timestamp is only
 * drawn when the data actually carries a matched second.
 */
export function ResultCard({ result, query }: { result: SearchResult; query: string }) {
  const video = result.kind === "video";
  const startSeconds = video ? result.startSeconds : null;

  return (
    <Link
      href={result.href}
      onClick={() =>
        posthog.capture("search_result_opened", {
          query,
          result_type: result.kind,
          rank: result.rank,
          lesson_slug: result.lessonSlug,
          course_slug: result.courseSlug,
          start_seconds: startSeconds,
        })
      }
      className={cn(
        "group flex flex-col gap-4 rounded-md border border-line bg-surface p-4",
        "transition-colors hover:border-line-strong sm:flex-row sm:gap-5",
      )}
    >
      {video ? <VideoPanel result={result} /> : <KeyPointsPanel result={result} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <CourseIcon iconRef={result.courseIconRef} courseTitle={result.courseTitle} />
            <span className="truncate text-data text-ink-muted">{result.courseTitle}</span>
          </span>
          <span
            className={cn(
              "shrink-0 rounded-xs px-2 py-1 text-meta",
              video ? "bg-moment-soft text-moment" : "bg-accent-soft text-accent",
            )}
          >
            {/* "Moment" only when the data carries a second (AGENTS §7) — and second
                zero is one: a chapter marker at 0:00 is where the topic is introduced. */}
            {video ? (startSeconds !== null ? "Moment" : "Video") : "Lesson"}
          </span>
        </div>

        <h3 className="mt-3 text-heading-3 text-ink">{result.lessonTitle}</h3>
        {/* A long grounded description is cut by the clamp rather than allowed to push
            the meta row down and break the rhythm of the list. */}
        <p className="mt-1.5 line-clamp-3 text-body text-ink-muted sm:line-clamp-2">
          {result.reason}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-4">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-data text-ink-muted">
            {result.label && <span>Lesson {result.label}</span>}
            {result.label && result.moduleTitle && (
              <span aria-hidden="true" className="text-ink-disabled">
                ·
              </span>
            )}
            {result.moduleTitle && <span className="truncate">{result.moduleTitle}</span>}
          </span>

          <div className="flex items-center gap-2 sm:gap-3">
            <SaveButton
              lessonId={result.lessonId}
              lessonTitle={result.lessonTitle}
              size="sm"
            />
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-data",
                video ? "text-moment" : "text-accent",
              )}
            >
              {video ? (
                <>
                  <Play size={13} aria-hidden="true" className="fill-current" />
                  {/* Never claims a second the data does not have (AGENTS §7). */}
                  {startSeconds !== null
                    ? `Watch from ${formatTimestamp(startSeconds)}`
                    : "Watch lesson"}
                </>
              ) : (
                <>
                  Open lesson
                  <ArrowUpRight size={14} aria-hidden="true" />
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** The 16:9 thumbnail, with the matched second stamped on it. */
function VideoPanel({ result }: { result: SearchResult }) {
  const poster = result.thumbnailRef
    ? urlFor(result.thumbnailRef).width(480).height(270).fit("crop").url()
    : null;
  const startSeconds = result.kind === "video" ? result.startSeconds : null;

  return (
    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-sm bg-raised sm:w-[240px]">
      {poster && (
        <Image
          src={poster}
          alt=""
          fill
          sizes="(min-width: 640px) 240px, 100vw"
          className="object-cover"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center bg-ink/20 transition-colors group-hover:bg-ink/10"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-surface/90 text-ink">
          <Play size={15} className="translate-x-px fill-current" />
        </span>
      </span>
      {startSeconds !== null && (
        <span className="absolute right-2 bottom-2 rounded-xs bg-moment px-1.5 py-0.5 text-data text-on-moment">
          {formatTimestamp(startSeconds)}
        </span>
      )}
      {result.durationSeconds !== null && (
        <span className="absolute left-2 bottom-2 rounded-xs bg-canvas/85 px-1.5 py-0.5 text-data text-ink-muted">
          {formatTimestamp(result.durationSeconds)}
        </span>
      )}
    </div>
  );
}

/** The key-points panel a lesson result shows instead of a thumbnail. */
function KeyPointsPanel({ result }: { result: SearchResult }) {
  return (
    <div className="flex aspect-video w-full shrink-0 flex-col gap-2 overflow-hidden rounded-sm border border-line bg-raised p-4 sm:w-[240px]">
      <FileText size={16} aria-hidden="true" className="shrink-0 text-ink-muted" />
      <ul className="flex flex-col gap-1.5">
        {result.keyPoints.slice(0, 3).map((point) => (
          <li key={point} className="flex gap-2 text-small text-ink-muted">
            <span aria-hidden="true" className="text-ink-disabled">
              &bull;
            </span>
            {/* One line each: a real key point is often a sentence, and two lines
                overflow the fixed 16:9 panel. */}
            <span className="line-clamp-1">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The course brand tile, matching the catalog card: cover image, else the initial. */
function CourseIcon({
  iconRef,
  courseTitle,
}: {
  iconRef: string | null;
  courseTitle: string;
}) {
  if (!iconRef) {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-xs bg-raised text-[11px] font-semibold text-ink-muted">
        {courseTitle.charAt(0)}
      </span>
    );
  }
  return (
    <Image
      src={urlFor(iconRef).width(40).height(40).fit("crop").url()}
      alt=""
      width={20}
      height={20}
      className="size-5 shrink-0 rounded-xs object-cover"
    />
  );
}
