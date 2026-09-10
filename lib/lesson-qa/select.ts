/**
 * Choosing what the model gets to see.
 *
 * The scope is one lesson, so there is no MCP and no tool loop here: this picks the
 * handful of transcript excerpts most likely to hold the answer and sends only those.
 * That is AGENTS §12's never-send-a-whole-transcript rule enforced structurally rather
 * than by instruction — the prompt physically cannot contain the rest of the video.
 *
 * No `@/` aliases, so `select.check.mjs` runs it under plain tsx.
 */

import { tokenize } from "../search/keyword.ts";

export type Chunk = { startSeconds: number | null; text: string | null };
export type Excerpt = { seconds: number; text: string };

/** `["cache*", "revalidate*"]` → `["cache", "revalidate"]`, for a plain substring test. */
function stems(question: string): string[] {
  return tokenize(question).map((term) => term.replace(/\*$/, ""));
}

/** Evenly spaced picks across a list, so a thin match still sees the whole video. */
function spread<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const step = items.length / count;
  return Array.from({ length: count }, (_, i) => items[Math.floor(i * step)]);
}

/**
 * The excerpts to show, in playback order.
 *
 * Scored by how many distinct question words a chunk contains — the same token-based
 * idea as the keyword search, which is all that is warranted for a list this short.
 *
 * Matching is whole-token, so "revalidation" does not find "revalidate", exactly as the
 * GROQ path behaves. Rather than guess at stems, the selection tops up to `limit` with
 * an even spread of the rest: the model always sees the shape of the whole video, and a
 * near-miss question still gets the passage it needed.
 */
export function selectExcerpts(
  question: string,
  chunks: Chunk[],
  limit: number,
): Excerpt[] {
  const excerpts: Excerpt[] = chunks
    .filter(
      (chunk): chunk is { startSeconds: number; text: string } =>
        typeof chunk.startSeconds === "number" && Boolean(chunk.text),
    )
    .map((chunk) => ({ seconds: chunk.startSeconds, text: chunk.text }))
    .sort((a, b) => a.seconds - b.seconds);

  if (excerpts.length <= limit) return excerpts;

  const terms = stems(question);
  const scored = excerpts.map((excerpt, index) => {
    const haystack = excerpt.text.toLowerCase();
    return { index, score: terms.filter((term) => haystack.includes(term)).length };
  });

  // Best first, earliest wins a tie.
  const chosen = new Set(
    scored
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, limit)
      .map((entry) => entry.index),
  );

  if (chosen.size < limit) {
    const rest = scored.filter((entry) => !chosen.has(entry.index));
    for (const entry of spread(rest, limit - chosen.size)) chosen.add(entry.index);
  }

  return excerpts.filter((_, index) => chosen.has(index));
}
