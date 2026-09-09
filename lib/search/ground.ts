import "server-only";

import { sanityFetch } from "@/sanity/lib/fetch";
import { LESSONS_BY_IDS_QUERY } from "@/sanity/lib/queries";

import { orderHits, sortResults, toResult, type GroundableLesson } from "./rank";
import type { ModelHit, SearchResult, Sort } from "./types";

/**
 * Grounding (AGENTS §7): the model says which lessons matched, and every field the
 * results page renders is read back out of Sanity here. The model cannot author a title,
 * a label, a duration or a count, so grounding holds structurally rather than by
 * instruction. The per-hit mapping and the ordering live in `rank.ts`, which has a
 * runnable check.
 */
export async function groundHits(
  hits: ModelHit[],
  sort: Sort,
): Promise<{ count: number; courseCount: number; results: SearchResult[] }> {
  const ordered = orderHits(hits);
  const ids = [...new Set(ordered.map((hit) => hit.lessonId))];
  if (!ids.length) return { count: 0, courseCount: 0, results: [] };

  const lessons = await sanityFetch({
    query: LESSONS_BY_IDS_QUERY,
    params: { ids },
    tags: ["lesson", "course"],
  });
  const byId = new Map(lessons.map((lesson) => [lesson._id, lesson]));

  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const hit of ordered) {
    if (seen.has(hit.lessonId)) continue;
    const lesson = byId.get(hit.lessonId);
    if (!lesson) {
      // A hallucinated or unpublished id never reaches the browser.
      console.warn(`search: dropped unresolvable lesson id ${hit.lessonId}`);
      continue;
    }
    const result = toResult(hit, lesson as GroundableLesson);
    if (!result) continue;
    seen.add(hit.lessonId);
    results.push(result);
  }

  const sorted = sortResults(
    results,
    sort,
    (lessonId) => byId.get(lessonId)?._createdAt ?? "",
  );

  return {
    count: sorted.length,
    courseCount: new Set(sorted.map((result) => result.courseSlug ?? result.courseTitle)).size,
    results: sorted,
  };
}
