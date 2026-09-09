import { z } from "zod";

/**
 * The search contract. Shared by the route and the results page, so this module is
 * deliberately NOT `server-only` — the client imports the response type.
 *
 * Two schemas, two trust levels:
 *  - `ModelAnswerSchema` is what the LLM is allowed to say: which lesson matched, why,
 *    and where the match came from. Nothing displayable.
 *  - `SearchResultSchema` is what the browser renders. Every field in it is read back
 *    out of Sanity by `ground.ts`, so the model cannot author a title, a label, a
 *    duration or a count (AGENTS §7).
 */

export const MAX_QUERY_LENGTH = 200;
/** Defensive only — §11 forbids capping to a handful. This bounds the enrichment query. */
export const MAX_RESULTS = 100;

export const SORTS = ["relevance", "newest", "duration"] as const;
export type Sort = (typeof SORTS)[number];

export const SORT_LABELS: Record<Sort, string> = {
  relevance: "Most Relevant",
  newest: "Newest",
  duration: "Shortest first",
};

export const SearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(MAX_QUERY_LENGTH),
  sort: z.enum(SORTS).default("relevance"),
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

/**
 * OpenAI structured outputs reject `optional` and range/length keywords: every property
 * must be present in `required`. So this schema is nullable-not-optional and carries no
 * constraints — the real bounds are enforced by `ground.ts`.
 */
export const ModelHitSchema = z.object({
  /** A real `_id` the model saw in a tool result. Verified against Sanity before use. */
  lessonId: z.string(),
  kind: z.enum(["video", "lesson"]),
  /** One sentence, grounded in what actually matched. */
  reason: z.string(),
  /** 1 = best. Ties are broken by array order. */
  rank: z.number(),
  /** Only ever set from a real chapter or transcript chunk. */
  startSeconds: z.number().nullable(),
  momentSource: z.enum(["chapter", "transcript"]).nullable(),
});
export type ModelHit = z.infer<typeof ModelHitSchema>;

export const ModelAnswerSchema = z.object({
  reply: z.string(),
  hits: z.array(ModelHitSchema),
});
export type ModelAnswer = z.infer<typeof ModelAnswerSchema>;

const SearchResultBaseSchema = z.object({
  lessonId: z.string(),
  lessonSlug: z.string(),
  lessonTitle: z.string(),
  courseTitle: z.string(),
  courseSlug: z.string().nullable(),
  /** Sanity asset ref for the course cover, used as the small brand tile. */
  courseIconRef: z.string().nullable(),
  moduleTitle: z.string().nullable(),
  /** Positional, e.g. "5.1". Derived from module/lesson order, never stored (§8). */
  label: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  keyPoints: z.array(z.string()),
  thumbnailRef: z.string().nullable(),
  reason: z.string(),
  rank: z.number(),
  href: z.string(),
});

export const SearchResultSchema = z.discriminatedUnion("kind", [
  SearchResultBaseSchema.extend({
    kind: z.literal("video"),
    /**
     * The matched second, from a real chapter or transcript chunk. `null` when nothing
     * matched a moment — the card then reads "Watch lesson" instead of "Watch from
     * 12:45" rather than inventing a timestamp (§7).
     */
    startSeconds: z.number().nullable(),
  }),
  SearchResultBaseSchema.extend({ kind: z.literal("lesson") }),
]);
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const SearchResponseSchema = z.object({
  query: z.string(),
  sort: z.enum(SORTS),
  /**
   * Which path produced these results: the Context MCP plus the LLM, or the GROQ keyword
   * fallback. Nothing renders it — it exists so the behaviour is observable in PostHog and
   * assertable from the response.
   */
  source: z.enum(["agent", "keyword"]),
  count: z.number(),
  /** Distinct courses represented, for "Found 28 results across 8 courses". */
  courseCount: z.number(),
  reply: z.string(),
  results: z.array(SearchResultSchema),
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
