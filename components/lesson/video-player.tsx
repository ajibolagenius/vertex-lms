"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Play } from "lucide-react";
import posthog from "posthog-js";
import { startSecondsFrom, youtubeEmbedUrl } from "@/lib/video";

/**
 * Playback stays on the site (AGENTS §7): the poster is a facade, and pressing it
 * swaps in the provider's own player. Nothing from YouTube loads until then.
 *
 * The start second comes from `?t=` — the param a search result deep-links with —
 * read here rather than from the page's `searchParams` so the route still
 * prerenders (see `node_modules/next/dist/docs/.../page.md`). The caller wraps
 * this in a `<Suspense>` boundary for that reason.
 */
export function LessonVideo({
  videoId,
  title,
  lessonSlug,
  poster,
  posterAlt,
}: {
  /** `null` when the URL is not a supported provider — poster only, no play control. */
  videoId: string | null;
  title: string;
  lessonSlug: string;
  poster: string | null;
  posterAlt: string;
}) {
  const startSeconds = startSecondsFrom(useSearchParams().get("t"));
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-900">
      {playing && videoId ? (
        <iframe
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
              className="object-cover opacity-80"
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
                  start_seconds: startSeconds,
                });
              }}
              className="absolute inset-0 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary-500"
            >
              <span className="flex size-[72px] items-center justify-center rounded-full bg-primary-500 shadow-lg transition-transform hover:scale-105">
                <Play size={28} aria-hidden="true" className="ml-1 fill-white text-white" />
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
