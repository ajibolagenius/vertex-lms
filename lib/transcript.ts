/**
 * The transcript panel's pure half: ingested chunks and chapters (AGENTS §9) turned into
 * the rows it renders, and which row is currently being spoken.
 *
 * No `@/` aliases and no React, so `transcript.check.mjs` runs it under plain tsx.
 */

export type Chunk = { startSeconds: number | null; text: string | null };
export type Chapter = { startSeconds: number | null; label: string | null };

export type Line = { seconds: number; text: string };
/** A chapter and the lines under it. `label: null` is the run before the first chapter. */
export type Group = { label: string | null; seconds: number; lines: Line[] };

/** Drops anything the ingestion left incomplete, and orders by time. */
export function toLines(chunks: Chunk[]): Line[] {
  return chunks
    .filter(
      (chunk): chunk is { startSeconds: number; text: string } =>
        typeof chunk.startSeconds === "number" && Boolean(chunk.text),
    )
    .map((chunk) => ({ seconds: chunk.startSeconds, text: chunk.text }))
    .sort((a, b) => a.seconds - b.seconds);
}

/**
 * Chunks under the chapter they fall in.
 *
 * Chapters are the clean labels and the transcript is the noisy backstop (AGENTS §7), so
 * they head the list rather than sitting beside it. Plenty of ingested videos have none,
 * which is one unlabelled group — not an error.
 */
export function groupByChapter(chapters: Chapter[], lines: Line[]): Group[] {
  const marks = chapters
    .filter(
      (chapter): chapter is { startSeconds: number; label: string } =>
        typeof chapter.startSeconds === "number" && Boolean(chapter.label),
    )
    .sort((a, b) => a.startSeconds - b.startSeconds);

  if (!marks.length) return lines.length ? [{ label: null, seconds: 0, lines }] : [];

  const groups: Group[] = marks.map((mark) => ({
    label: mark.label,
    seconds: mark.startSeconds,
    lines: [],
  }));
  // Anything before the first marker still has to go somewhere.
  const lead: Group = { label: null, seconds: 0, lines: [] };

  for (const line of lines) {
    let index = -1;
    for (let i = 0; i < marks.length; i += 1) {
      if (marks[i].startSeconds <= line.seconds) index = i;
    }
    (index < 0 ? lead : groups[index]).lines.push(line);
  }

  return [lead, ...groups].filter((group) => group.lines.length > 0);
}

/**
 * The second of the line being spoken: the last one that has started. Before the first
 * line starts it is the first line, so the panel always has something highlighted, and
 * `-1` only when there is no transcript at all.
 */
export function activeSeconds(lines: Line[], position: number): number {
  if (!lines.length) return -1;
  let active = lines[0].seconds;
  for (const line of lines) {
    if (line.seconds <= position) active = line.seconds;
  }
  return active;
}
