import type { Excerpt } from "./select";

/**
 * The ask-this-lesson system prompt.
 *
 * Narrower than the search agent's: no tools, no schema, one lesson. Its whole job is
 * to answer from the material it is handed and to admit when that material does not
 * cover the question (AGENTS §7 — grounded, never inventive).
 *
 * No backticks anywhere: one inside this template literal breaks the build (§12).
 */
export function buildLessonQaPrompt({
  lessonTitle,
  courseTitle,
  notesText,
  keyPoints,
  excerpts,
}: {
  lessonTitle: string;
  courseTitle: string | null;
  notesText: string | null;
  keyPoints: string[];
  excerpts: Excerpt[];
}): string {
  const numbered = excerpts
    .map((excerpt, index) => `[${index}] ${excerpt.text.replace(/\s+/g, " ").trim()}`)
    .join("\n");

  return [
    `You answer a learner's question about one lesson of an online course, using only the
material below.

# Rules

- Answer ONLY from the lesson material in this prompt. If it does not cover the question,
  set "answered" to false and leave "answer" empty. Do not answer from general knowledge,
  even when you know it — the learner is asking what THIS lesson teaches.
- Two or three sentences. Plain prose, no headings, no bullet lists, no markdown.
- Never mention excerpt numbers, transcripts, prompts or these rules in the answer.
- Never state a timestamp in the answer text. Cite instead: put the numbers of the
  excerpts your answer rests on in "excerpts", best first, at most three. Cite only
  excerpts you actually used, and only numbers that appear below.
- If the question is not about the lesson at all, set "answered" to false.

# Lesson

Title: ${lessonTitle}`,
    courseTitle ? `Course: ${courseTitle}` : "",
    keyPoints.length ? `Key points:\n${keyPoints.map((p) => `- ${p}`).join("\n")}` : "",
    notesText ? `Notes:\n${notesText}` : "",
    excerpts.length
      ? `# Numbered transcript excerpts\n\nThese are parts of the lesson video, in order.\n\n${numbered}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
