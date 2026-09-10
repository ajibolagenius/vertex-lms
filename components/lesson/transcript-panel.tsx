"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import posthog from "posthog-js";
import { usePlayerControls, usePlayerPosition } from "@/components/lesson/player-context";
import { formatTimestamp } from "@/lib/format";
import {
  activeSeconds as activeLineSeconds,
  groupByChapter,
  toLines,
  type Chapter,
  type Chunk,
  type Line,
} from "@/lib/transcript";
import { cn } from "@/lib/utils";

/**
 * The transcript beside the video: filter it, click a line, the video jumps there.
 *
 * Everything it renders is ingested data (AGENTS §9) — chapters first, transcript chunks
 * under them — and every timestamp is a real `startSeconds`, never computed.
 */

/** The matched substring, marked. Case-insensitive, and the needle is never a pattern. */
function highlight(text: string, needle: string) {
  if (!needle) return text;
  const at = text.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-moment-soft text-moment">{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  );
}

export function TranscriptPanel({
  chapters,
  chunks,
  lessonSlug,
  courseSlug,
}: {
  chapters: Chapter[];
  chunks: Chunk[];
  lessonSlug: string;
  courseSlug?: string;
}) {
  const { seekTo } = usePlayerControls();
  const position = usePlayerPosition();
  const [filter, setFilter] = useState("");

  const lines = useMemo<Line[]>(() => toLines(chunks), [chunks]);

  const query = filter.trim();
  const matches = query
    ? lines.filter((line) => line.text.toLowerCase().includes(query.toLowerCase()))
    : lines;

  // Filtering flattens the list: a chapter heading over a single stray match is noise.
  const groups = query
    ? [{ key: "matches", label: null, seconds: 0, lines: matches }]
    : groupByChapter(chapters, lines);

  const active = activeLineSeconds(lines, position);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* No heading: the rail tab above already says Transcript. */}
      <div className="px-5 pt-4 pb-4">
        <div className="relative">
          <Search
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Find in transcript…"
            aria-label="Find in transcript"
            className="h-9 w-full rounded-sm border border-line bg-surface pr-16 pl-8 text-[14px] text-ink placeholder:text-ink-disabled hover:border-line-strong focus:border-accent focus:outline-none"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-data text-ink-disabled">
            {query ? `${matches.length}/${lines.length}` : lines.length}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        {matches.length === 0 ? (
          <p className="px-5 py-6 text-body text-ink-muted">
            Nothing in this transcript matches &ldquo;{query}&rdquo;.
          </p>
        ) : (
          groups.map((entry) => (
            <section key={entry.key}>
              {entry.label && (
                <h3 className="sticky top-0 z-10 flex items-baseline gap-2 bg-canvas/95 px-5 py-2 backdrop-blur">
                  <span className="text-data text-ink-disabled">
                    {formatTimestamp(entry.seconds)}
                  </span>
                  <span className="text-meta text-ink">{entry.label}</span>
                </h3>
              )}
              <ol>
                {entry.lines.map((line) => (
                  <TranscriptLine
                    key={line.key}
                    line={line}
                    query={query}
                    isActive={line.seconds === active}
                    follow={!query}
                    onSeek={() => {
                      seekTo(line.seconds);
                      posthog.capture("transcript_seek", {
                        lesson_slug: lessonSlug,
                        course_slug: courseSlug,
                        seconds: line.seconds,
                        source: "transcript",
                        from_search: Boolean(query),
                      });
                    }}
                  />
                ))}
              </ol>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function TranscriptLine({
  line,
  query,
  isActive,
  follow,
  onSeek,
}: {
  line: Line;
  query: string;
  isActive: boolean;
  /** Scroll this line into view when it becomes the active one. Off while filtering. */
  follow: boolean;
  onSeek: () => void;
}) {
  const element = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!isActive || !follow) return;
    // Syncing with an external system (the scroll container), not derived state.
    element.current?.scrollIntoView({ block: "nearest" });
  }, [isActive, follow]);

  return (
    <li ref={element}>
      <button
        type="button"
        onClick={onSeek}
        className={cn(
          "flex w-full gap-3 border-l-2 px-5 py-2 text-left transition-colors",
          isActive
            ? "border-accent bg-raised"
            : "border-transparent hover:border-line-strong hover:bg-raised",
        )}
      >
        <span
          className={cn(
            "shrink-0 pt-0.5 text-data",
            isActive ? "text-accent" : "text-ink-disabled",
          )}
        >
          {formatTimestamp(line.seconds)}
        </span>
        <span className={cn("text-body", isActive ? "text-ink" : "text-ink-muted")}>
          {highlight(line.text, query)}
        </span>
      </button>
    </li>
  );
}
