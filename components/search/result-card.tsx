"use client";

import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import {
  Check,
  ChevronRight,
  CirclePlay,
  FileText,
  Folder,
  Play,
  SquareArrowOutUpRight,
} from "lucide-react";
import { formatTimestamp } from "@/lib/format";
import type { SearchResult } from "@/lib/search/types";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";

/**
 * One search result, in the two kinds the reference draws (AGENTS §11). Both share the
 * whole right-hand column and differ only in the left panel and the action, so this is
 * one component with a branch rather than two near-identical files.
 *
 * Every value comes from the response, which the route grounded against Sanity — nothing
 * here is derived, defaulted or invented client-side.
 *
 * `"use client"` is explicit because the card captures its own click — it was already in
 * the client bundle, imported by `SearchResults`.
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
        "group flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm",
        "transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        "sm:flex-row sm:gap-5",
      )}
    >
      {video ? <VideoPanel result={result} /> : <KeyPointsPanel result={result} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <CourseIcon
              iconRef={result.courseIconRef}
              courseTitle={result.courseTitle}
            />
            <span className="truncate text-[14px] leading-[20px] text-neutral-700">
              {result.courseTitle}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 rounded-[6px] px-2 py-1 text-[12px] leading-[16px] font-semibold tracking-wider uppercase",
              video
                ? "bg-primary-100 text-primary-500"
                : "bg-lesson-bg text-lesson-fg",
            )}
          >
            {video ? "Video" : "Lesson"}
          </span>
        </div>

        <h3 className="mt-2 text-[17px] leading-[26px] font-semibold text-neutral-900">
          {result.lessonTitle}
        </h3>
        {/* Two lines, as the reference draws it — a long grounded description is cut by
            the clamp rather than allowed to push the meta row down. */}
        <p className="mt-1.5 line-clamp-3 text-[14px] leading-[21px] text-neutral-500 sm:line-clamp-2">
          {result.reason}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-[18px] text-neutral-500">
            {video ? (
              <>
                {result.label && (
                  <span className="inline-flex items-center gap-1.5">
                    <FileText size={14} aria-hidden="true" />
                    Lesson {result.label}
                  </span>
                )}
                {result.moduleTitle && (
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true">&middot;</span>
                    <Folder size={14} aria-hidden="true" />
                    {result.moduleTitle}
                  </span>
                )}
              </>
            ) : (
              result.label && <span>Module {result.label.split(".")[0]}</span>
            )}
          </span>

          <span className="inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-semibold text-primary-500 group-hover:text-primary-600">
            {video ? (
              <>
                <CirclePlay size={16} aria-hidden="true" />
                {/* The label never claims a second the data does not have (AGENTS §7). */}
                {startSeconds ? `Watch from ${formatTimestamp(startSeconds)}` : "Watch lesson"}
              </>
            ) : (
              <>
                View lesson
                <SquareArrowOutUpRight size={14} aria-hidden="true" />
              </>
            )}
            <ChevronRight size={16} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** The 16:9 thumbnail with the play affordance and the clip-length chip. */
function VideoPanel({ result }: { result: SearchResult }) {
  const poster = result.thumbnailRef
    ? urlFor(result.thumbnailRef).width(552).height(311).fit("crop").url()
    : null;

  return (
    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md bg-neutral-900 sm:w-[276px]">
      {poster && (
        <Image
          src={poster}
          alt=""
          fill
          sizes="(min-width: 640px) 276px, 100vw"
          className="object-cover"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-md"
      >
        <Play size={18} className="translate-x-[1px] fill-current" />
      </span>
      {result.durationSeconds !== null && (
        <span className="absolute right-2 bottom-2 rounded-[6px] bg-neutral-900/85 px-2 py-1 text-[12px] leading-[16px] font-medium text-white">
          {formatTimestamp(result.durationSeconds)}
        </span>
      )}
    </div>
  );
}

/** The tinted key-points panel a lesson result shows instead of a thumbnail. */
function KeyPointsPanel({ result }: { result: SearchResult }) {
  return (
    <div className="relative flex aspect-video w-full shrink-0 flex-col gap-2 overflow-hidden rounded-md border border-line bg-paper p-4 sm:w-[276px]">
      <FileText size={18} aria-hidden="true" className="shrink-0 text-neutral-500" />
      <ul className="flex flex-col gap-1.5 pl-1">
        {result.keyPoints.slice(0, 3).map((point) => (
          <li
            key={point}
            className="flex gap-2 text-[13px] leading-[18px] text-neutral-700"
          >
            <span aria-hidden="true" className="text-neutral-500">
              &bull;
            </span>
            {/* One line each, as the reference draws them. A real key point is often a
                sentence, and two lines overflow the fixed 16:9 panel. */}
            <span className="line-clamp-1">{point}</span>
          </li>
        ))}
      </ul>
      {/* Presentational, like the lesson sidebar's ticks: progress is not tracked yet
          (AGENTS §7). It becomes real when the progress record lands. */}
      <span
        aria-hidden="true"
        className="absolute right-3 bottom-3 flex size-7 items-center justify-center rounded-full bg-neutral-900 text-white"
      >
        <Check size={14} strokeWidth={3} />
      </span>
    </div>
  );
}

/** The course brand tile, matching `CourseGrid`: cover image, else the initial. */
function CourseIcon({
  iconRef,
  courseTitle,
}: {
  iconRef: string | null;
  courseTitle: string;
}) {
  if (!iconRef) {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-neutral-900 text-[12px] font-semibold text-white">
        {courseTitle.charAt(0)}
      </span>
    );
  }
  return (
    <Image
      src={urlFor(iconRef).width(48).height(48).fit("crop").url()}
      alt=""
      width={24}
      height={24}
      className="size-6 shrink-0 rounded-[6px] object-cover"
    />
  );
}
