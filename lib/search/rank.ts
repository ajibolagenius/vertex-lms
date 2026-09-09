import { lessonLabel } from "../format.ts";
import { youtubeId } from "../video.ts";
import { MAX_RESULTS, type ModelHit, type SearchResult, type Sort } from "./types.ts";

/**
 * The pure half of grounding: turning one model hit plus the lesson Sanity returned into
 * a card, and ordering the set. No Sanity client and no `@/` aliases here, so
 * `rank.check.mjs` can run it under plain node.
 *
 * Everything displayable comes from `lesson`; the hit contributes only which lesson, why,
 * and in what order (AGENTS §7).
 */

/** The shape `LESSONS_BY_IDS_QUERY` returns, narrowed to what this file reads. */
export type GroundableLesson = {
  _id: string;
  _createdAt: string;
  title: string | null;
  slug: string | null;
  duration: number | null;
  videoUrl: string | null;
  keyPoints: Array<string | null> | null;
  thumbnailRef: string | null;
  course: {
    title: string | null;
    slug: string | null;
    iconRef: string | null;
    modules: Array<{ title: string | null; lessonIds: Array<string> | null }> | null;
  } | null;
};

export function orderHits(hits: ModelHit[]): ModelHit[] {
  return [...hits].sort((a, b) => a.rank - b.rank).slice(0, MAX_RESULTS);
}

/**
 * `null` when the lesson cannot be rendered — no slug means no page to link to.
 *
 * Two invariants are enforced here rather than asked for in the prompt:
 *  1. A `video` card needs a lesson whose `videoUrl` is a real, playable provider URL;
 *     otherwise the hit is downgraded to a lesson card.
 *  2. `startSeconds` survives only when the model attributes it to a real chapter or
 *     transcript chunk. Without one the card reads "Watch lesson" rather than inventing a
 *     moment (§7/§9).
 */
export function toResult(hit: ModelHit, lesson: GroundableLesson): SearchResult | null {
  if (!lesson.slug) return null;

  const modules = lesson.course?.modules ?? [];
  const moduleIndex = modules.findIndex((module) =>
    (module.lessonIds ?? []).includes(lesson._id),
  );
  const lessonIndex =
    moduleIndex < 0 ? -1 : (modules[moduleIndex].lessonIds ?? []).indexOf(lesson._id);

  const startSeconds =
    hit.momentSource && hit.startSeconds && hit.startSeconds > 0
      ? Math.floor(hit.startSeconds)
      : null;

  const base = {
    lessonId: lesson._id,
    lessonSlug: lesson.slug,
    lessonTitle: lesson.title ?? "Untitled lesson",
    courseTitle: lesson.course?.title ?? "Vertex",
    courseSlug: lesson.course?.slug ?? null,
    courseIconRef: lesson.course?.iconRef ?? null,
    moduleTitle: moduleIndex < 0 ? null : (modules[moduleIndex].title ?? null),
    label: moduleIndex < 0 || lessonIndex < 0 ? null : lessonLabel(moduleIndex, lessonIndex),
    durationSeconds: lesson.duration ?? null,
    keyPoints: (lesson.keyPoints ?? []).filter((point): point is string => Boolean(point)),
    thumbnailRef: lesson.thumbnailRef ?? null,
    reason: hit.reason,
    rank: hit.rank,
    href: `/lessons/${lesson.slug}${startSeconds ? `?t=${startSeconds}` : ""}`,
  };

  // A real chapter or transcript moment is the stronger signal, so it decides the card;
  // with no moment, the model's own `kind` does. Either way it has to be playable.
  return youtubeId(lesson.videoUrl) && (startSeconds !== null || hit.kind === "video")
    ? { ...base, kind: "video", startSeconds }
    : { ...base, kind: "lesson" };
}

/** Server-side, so the sort control cannot diverge from the returned order. */
export function sortResults(
  results: SearchResult[],
  sort: Sort,
  createdAt: (lessonId: string) => string,
): SearchResult[] {
  if (sort === "relevance") return results;

  if (sort === "newest") {
    return [...results].sort((a, b) =>
      createdAt(b.lessonId).localeCompare(createdAt(a.lessonId)),
    );
  }

  // Shortest first; a lesson with no duration sorts last rather than as zero.
  return [...results].sort(
    (a, b) => (a.durationSeconds ?? Infinity) - (b.durationSeconds ?? Infinity),
  );
}
