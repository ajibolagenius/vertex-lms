import type { ModelHit } from "./types.ts";

/**
 * The keyword search's pure half: turning a learner's sentence into GROQ match terms, and
 * one row of `SEARCH_LESSONS_QUERY` into the same `ModelHit` the model would have produced.
 *
 * Feeding the existing `ModelHit` -> `toResult` path is deliberate: card selection, the
 * positional label, the `?t=` deep link and the "no moment means no timestamp" rule stay
 * in one place, whether the hits came from the LLM or from here.
 *
 * No `@/` aliases and no Sanity client, so `keyword.check.mjs` runs it under plain tsx.
 */

/** Bounds the GROQ query a learner's sentence can produce. */
const MAX_TERMS = 8;
const MAX_TERM_LENGTH = 32;
const MAX_DESCRIPTION = 155;

/**
 * Words that match most of the catalog and would flatten the ranking. Deliberately short —
 * a stopword list is a maintenance liability, and the term weights already do the work.
 */
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "does", "for",
  "from", "how", "i", "in", "into", "is", "it", "me", "my", "of", "on", "or", "s", "so",
  "that", "the", "then", "this", "to", "use", "using", "want", "was", "what", "when",
  "where", "which", "why", "with", "you", "your",
]);

/**
 * `"How do I fetch data?"` → `["fetch*", "data*"]`.
 *
 * Token-based and wildcarded, per AGENTS §11: `match` against an ARRAY of patterns is AND,
 * so the query ORs these with the count-terms form instead. Stripping to alphanumerics
 * also means a term can never carry GROQ pattern syntax of its own.
 */
export function tokenize(query: string): string[] {
  const seen = new Set<string>();

  for (const raw of String(query).toLowerCase().split(/[^a-z0-9]+/)) {
    const word = raw.slice(0, MAX_TERM_LENGTH);
    // One-character tokens match nearly everything; stopwords match the rest.
    if (word.length < 2 || STOPWORDS.has(word)) continue;
    seen.add(`${word}*`);
    if (seen.size === MAX_TERMS) break;
  }

  return [...seen];
}

/** The shape `SEARCH_LESSONS_QUERY` returns, narrowed to what ranking reads. */
export type KeywordRow = {
  _id: string;
  title: string | null;
  notesText: string | null;
  titleTerms: string[] | null;
  keyPointTerms: string[] | null;
  notesTerms: string[] | null;
  video: {
    videoTerms: string[] | null;
    chapterMoments: Array<{ startSeconds: number | null }> | null;
    transcriptMoments: Array<{ startSeconds: number | null }> | null;
  } | null;
};

/**
 * Specificity, per §11: a title containing the concept outranks a broad keyword hit in the
 * notes. A chapter label is authored, so it outranks the notes too; a transcript line is
 * the noisiest signal and scores lowest.
 */
const WEIGHTS = { title: 8, keyPoints: 4, chapter: 3, notes: 2, transcript: 1 };

function score(row: KeywordRow): number {
  return (
    (row.titleTerms ?? []).length * WEIGHTS.title +
    (row.keyPointTerms ?? []).length * WEIGHTS.keyPoints +
    (row.video?.chapterMoments ?? []).length * WEIGHTS.chapter +
    (row.notesTerms ?? []).length * WEIGHTS.notes +
    (row.video?.transcriptMoments ?? []).length * WEIGHTS.transcript
  );
}

/**
 * How many of the learner's words this lesson accounts for anywhere — its text or its
 * video. This is what keeps a broad term from smearing: "data fetching" matches "data*"
 * across most of the catalog, and only the lessons that also match "fetching*" are
 * actually about it.
 */
export function coverage(row: KeywordRow): number {
  return new Set([
    ...(row.titleTerms ?? []),
    ...(row.keyPointTerms ?? []),
    ...(row.notesTerms ?? []),
    ...(row.video?.videoTerms ?? []),
  ]).size;
}

/** First real second in a moment list, or `null`. */
function firstSecond(
  moments: Array<{ startSeconds: number | null }> | null | undefined,
): number | null {
  for (const moment of moments ?? []) {
    if (typeof moment.startSeconds === "number" && moment.startSeconds >= 0) {
      return Math.floor(moment.startSeconds);
    }
  }
  return null;
}

/**
 * The lesson's own prose, as the card's description — the reference draws a sentence about
 * the lesson, and this is the grounded version of it. First paragraph, cut on a word
 * boundary.
 */
export function cardDescription(notesText: string | null | undefined): string {
  const paragraph = String(notesText ?? "")
    .split(/\n\s*\n/)[0]
    .replace(/\s+/g, " ")
    .trim();
  if (paragraph.length <= MAX_DESCRIPTION) return paragraph;

  const cut = paragraph.slice(0, MAX_DESCRIPTION);
  const boundary = cut.lastIndexOf(" ");
  return `${(boundary > 40 ? cut.slice(0, boundary) : cut).replace(/[,;:.]$/, "")}…`;
}

/**
 * Rows → ranked hits. A row with a real moment becomes a video hit at that second; a row
 * matched on its text alone becomes a lesson hit, which is exactly the split §11 draws.
 * Ties break on title, so two identical searches return the same order.
 */
export function toHits(rows: KeywordRow[]): ModelHit[] {
  // Keep only the rows that cover the most of the query. Self-tuning: a one-word query
  // keeps everything, and a lesson matching one word out of three never outranks the
  // lessons matching all three — it just does not show.
  const best = rows.reduce((max, row) => Math.max(max, coverage(row)), 0);

  return rows
    .filter((row) => coverage(row) === best)
    .map((row) => {
      const chapterSecond = firstSecond(row.video?.chapterMoments);
      // Two-stage, per §7: chapters first, transcript only when no chapter matched.
      const startSeconds = chapterSecond ?? firstSecond(row.video?.transcriptMoments);
      const momentSource: ModelHit["momentSource"] =
        chapterSecond !== null ? "chapter" : startSeconds !== null ? "transcript" : null;

      return {
        row,
        hit: {
          lessonId: row._id,
          kind: momentSource ? ("video" as const) : ("lesson" as const),
          reason: cardDescription(row.notesText),
          rank: 0,
          startSeconds,
          momentSource,
        },
        score: score(row),
      };
    })
    .sort((a, b) => b.score - a.score || (a.row.title ?? "").localeCompare(b.row.title ?? ""))
    .map((entry, index) => ({ ...entry.hit, rank: index + 1 }));
}
