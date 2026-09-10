"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Play } from "lucide-react";
import posthog from "posthog-js";
import { usePlayerControls } from "@/components/lesson/player-context";
import { saveProgress } from "@/lib/progress-client";
import { startSecondsFrom, youtubeEmbedUrl } from "@/lib/video";
import { cn } from "@/lib/utils";

/**
 * Playback stays on the site (AGENTS §7): the poster is a facade, and pressing it
 * swaps in the provider's own player. Nothing from YouTube loads until then.
 *
 * The start second comes from `?t=` — the param a search result deep-links with —
 * read here rather than from the page's `searchParams` so the route still
 * prerenders (see `node_modules/next/dist/docs/.../page.md`). The caller wraps
 * this in a `<Suspense>` boundary for that reason.
 */

/** Watch depth is reported at these percentages, each at most once per mount. */
const MILESTONES = [25, 50, 75, 100] as const;
/** Also how often the transcript's highlight moves, so it is a second-ish, not a minute. */
const POLL_MS = 2_000;
/**
 * How far playback must move before the resume position is written again. The poll runs
 * every 5s but a write every 5s is pointless traffic, and resuming up to 15s early is the
 * right direction to be wrong in.
 */
const SAVE_EVERY_SECONDS = 15;
const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

/** The slice of the IFrame API this file uses. The full typings are a dependency we don't need. */
type YouTubePlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  destroy: () => void;
};
declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLIFrameElement,
        options: { events?: { onReady?: () => void } },
      ) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Loads the IFrame API once per document and resolves when `window.YT` is usable.
 * Only ever called after a play click, so a learner who never watches pays nothing.
 */
function loadIframeApi(): Promise<NonNullable<Window["YT"]>> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    // The API calls this global exactly once, so chain onto whatever is already there
    // rather than overwriting another player's callback.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
    };
    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = IFRAME_API_SRC;
      document.head.appendChild(script);
    }
  });
}

export function LessonVideo({
  videoId,
  title,
  lessonId,
  lessonSlug,
  courseSlug,
  poster,
  posterAlt,
}: {
  /** `null` when the URL is not a supported provider — poster only, no play control. */
  videoId: string | null;
  title: string;
  lessonId: string;
  lessonSlug: string;
  courseSlug?: string;
  poster: string | null;
  posterAlt: string;
}) {
  const deepLinkSeconds = startSecondsFrom(useSearchParams().get("t"));
  const { isSignedIn } = useAuth();
  const { registerSeek, reportPosition } = usePlayerControls();
  const [playing, setPlaying] = useState(false);
  /** Where the embed starts. `?t=` at first, then wherever a transcript click asks for. */
  const [startSeconds, setStartSeconds] = useState(deepLinkSeconds);
  const iframe = useRef<HTMLIFrameElement>(null);
  /** The live player, once the API has attached — what makes a seek instant. */
  const player = useRef<YouTubePlayer | null>(null);
  /** Last second written to `/api/progress`, so the poll only writes on real movement. */
  const lastSaved = useRef(deepLinkSeconds);

  /**
   * Publishes the seek. Before playback has started there is no player to seek, so the
   * click starts it at that second instead — one control, two states.
   */
  useEffect(() => {
    registerSeek((seconds) => {
      lastSaved.current = seconds;
      if (player.current) {
        player.current.seekTo(seconds, true);
        player.current.playVideo();
        return;
      }
      setStartSeconds(seconds);
      setPlaying(true);
    });
    return () => registerSeek(null);
  }, [registerSeek]);

  /**
   * Watch depth. Polling `getCurrentTime()` is what the IFrame API offers — there is no
   * progress event — and a 2s tick is fine for both the milestones and the transcript
   * highlight.
   *
   * ponytail: depth is "furthest point reached", not seconds actually watched, so a scrub
   * to the end counts as 100%. Track real coverage only if the drop-off numbers need it.
   *
   * The same tick writes the resume position (AGENTS §7), throttled to `SAVE_EVERY_SECONDS`.
   * The browser posts to our own route and never to Sanity (§5).
   */
  useEffect(() => {
    if (!playing || !iframe.current) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    const reported = new Set<number>();

    loadIframeApi().then((YT) => {
      if (cancelled || !iframe.current) return;
      player.current = new YT.Player(iframe.current, {
        events: {
          onReady: () => {
            // `onReady` can land after cleanup (React runs effects twice in dev), and an
            // interval started then would never be cleared.
            if (cancelled) return;
            timer = setInterval(() => {
              const duration = player.current?.getDuration() ?? 0;
              const position = player.current?.getCurrentTime() ?? 0;
              if (duration <= 0) return;
              const percent = (position / duration) * 100;
              for (const milestone of MILESTONES) {
                // 100% never quite arrives while polling, so treat the last few seconds as the end.
                const reached =
                  milestone === 100 ? duration - position <= POLL_MS / 1000 : percent >= milestone;
                if (!reached || reported.has(milestone)) continue;
                reported.add(milestone);
                posthog.capture("video_watch_progress", {
                  lesson_slug: lessonSlug,
                  course_slug: courseSlug,
                  percent: milestone,
                  position_seconds: Math.floor(position),
                  duration_seconds: Math.floor(duration),
                });
              }
              // Where the learner actually is, not the second they arrived on.
              const seconds = Math.floor(position);
              reportPosition(seconds);
              if (isSignedIn && Math.abs(seconds - lastSaved.current) >= SAVE_EVERY_SECONDS) {
                lastSaved.current = seconds;
                saveProgress({ lessonId, positionSeconds: seconds });
              }

              if (reported.has(100) && timer) clearInterval(timer);
            }, POLL_MS);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      // Deliberately no `player.destroy()`: it removes the iframe from the DOM, which is
      // React's node to remove. Clearing the poll is enough — the iframe unmounts with it.
      player.current = null;
    };
  }, [playing, lessonId, lessonSlug, courseSlug, isSignedIn, reportPosition]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-md border border-line bg-raised">
      {playing && videoId ? (
        <iframe
          ref={iframe}
          src={youtubeEmbedUrl(videoId, startSeconds)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <>
          {poster && (
            <Image
              src={poster}
              alt={posterAlt}
              fill
              priority
              sizes="(min-width: 1024px) 608px, 100vw"
              className="object-cover"
            />
          )}
          {videoId && (
            <button
              type="button"
              aria-label={`Play ${title}`}
              onClick={() => {
                setPlaying(true);
                posthog.capture("video_played", {
                  lesson_slug: lessonSlug,
                  course_slug: courseSlug,
                  start_seconds: startSeconds,
                  resumed: startSeconds > 0,
                });
              }}
              className={cn(
                "group absolute inset-0 flex items-center justify-center bg-ink/15",
                "transition-colors hover:bg-ink/5",
                // The frame clips overflow, so the shared ring has to be drawn inside it.
                "focus-visible:-outline-offset-4",
              )}
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-accent transition-transform group-hover:scale-105">
                <Play
                  size={24}
                  aria-hidden="true"
                  className="ml-1 fill-on-accent text-on-accent"
                />
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
