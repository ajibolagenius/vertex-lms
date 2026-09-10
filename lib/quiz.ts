/**
 * Grading a lesson quiz.
 *
 * Pure, and deliberately client-side: the questions ship to the browser with their
 * answers because this is a learning aid, not an exam. Nothing is gated on the score —
 * it is recorded on the learner's own progress record and shown back to them.
 *
 * No `@/` aliases, so `quiz.check.mjs` runs it under plain tsx.
 */

export type Question = {
  question: string | null;
  options: (string | null)[] | null;
  answerIndex: number | null;
  explanation: string | null;
  startSeconds: number | null;
};

/** A question with everything it needs to be asked. Anything else is dropped. */
export type Askable = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  startSeconds: number | null;
};

export type Graded = {
  index: number;
  chosen: number | null;
  isCorrect: boolean;
};

export type Result = {
  correct: number;
  total: number;
  /** 0–100, rounded. The value written to the progress record. */
  percent: number;
  graded: Graded[];
};

/**
 * Drops any question the generator left unusable — a missing answer, fewer than two
 * options, an index outside them — rather than rendering a question that cannot be
 * answered correctly.
 *
 * A blank option disqualifies the whole question rather than being filtered out:
 * removing one shifts every later index, which would silently move `answerIndex` onto
 * the wrong option. Losing a question is recoverable; marking a right answer wrong is not.
 */
export function askable(questions: Question[]): Askable[] {
  const usable: Askable[] = [];
  for (const entry of questions) {
    const options = entry.options ?? [];
    if (
      options.some((option) => !option?.trim()) ||
      !entry.question ||
      !entry.explanation ||
      options.length < 2 ||
      typeof entry.answerIndex !== "number" ||
      !Number.isInteger(entry.answerIndex) ||
      entry.answerIndex < 0 ||
      entry.answerIndex >= options.length
    ) {
      continue;
    }
    usable.push({
      question: entry.question,
      options: options as string[],
      answerIndex: entry.answerIndex,
      explanation: entry.explanation,
      startSeconds: typeof entry.startSeconds === "number" ? entry.startSeconds : null,
    });
  }
  return usable;
}

/** `answers[i]` is the option the learner picked, or `null` if they skipped it. */
export function grade(questions: Askable[], answers: (number | null)[]): Result {
  const graded = questions.map((question, index) => {
    const chosen = answers[index] ?? null;
    return { index, chosen, isCorrect: chosen === question.answerIndex };
  });
  const correct = graded.filter((entry) => entry.isCorrect).length;
  const total = questions.length;
  return {
    correct,
    total,
    percent: total ? Math.round((correct / total) * 100) : 0,
    graded,
  };
}
