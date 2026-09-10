import { z } from "zod";

/**
 * The ask-this-lesson contract. Shared by the route and the panel, so this module is
 * deliberately NOT `server-only` — the client imports the response type.
 *
 * Two trust levels, as in search (`lib/search/types.ts`):
 *  - `ModelReplySchema` is what the LLM is allowed to say: prose, and which of the
 *    numbered excerpts it used. It cannot author a timestamp.
 *  - `LessonQaResponse` is what the browser renders. Every citation in it is a real
 *    chunk's `startSeconds`, resolved server-side from the excerpt index (AGENTS §7).
 */

export const MAX_QUESTION_LENGTH = 500;
/** How many transcript excerpts the model is shown. The §12 context-window guard. */
export const MAX_EXCERPTS = 20;

/** Sanity's document id charset — the same guard the progress route uses. */
const SANITY_ID = /^[A-Za-z0-9._-]{1,128}$/;

export const LessonQaRequestSchema = z.object({
  lessonId: z.string().regex(SANITY_ID),
  question: z.string().trim().min(3).max(MAX_QUESTION_LENGTH),
});
export type LessonQaRequest = z.infer<typeof LessonQaRequestSchema>;

/**
 * Structured outputs reject `optional` and range keywords, so this is
 * nullable-not-optional and unconstrained; the route enforces the real bounds.
 *
 * Citations are INDEXES into the excerpt list the prompt numbered, never seconds. An
 * index the model invents is out of range and gets dropped; a second it invents would
 * look plausible. That is the difference between grounding by structure and by
 * instruction.
 */
export const ModelReplySchema = z.object({
  /** Plain prose. Empty when the lesson does not cover the question. */
  answer: z.string(),
  /** False when the material does not answer it — the panel says so instead. */
  answered: z.boolean(),
  excerpts: z.array(z.number()),
});
export type ModelReply = z.infer<typeof ModelReplySchema>;

/** A moment the answer leans on. `seconds` always came from an ingested chunk. */
export type Citation = { seconds: number; text: string };

export type LessonQaResponse = {
  answer: string;
  answered: boolean;
  citations: Citation[];
};
