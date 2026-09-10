/** Self-check for quiz grading: `npm run check:quiz`. */
import assert from "node:assert/strict";

import { askable, grade } from "./quiz.ts";

const good = {
  question: "What does revalidateTag do?",
  options: ["Clears a tagged cache entry", "Restarts the server", "Nothing"],
  answerIndex: 0,
  explanation: "It invalidates every entry tagged with that name.",
  startSeconds: 120,
};

// Unusable questions never reach the learner.
const usable = askable([
  good,
  { ...good, answerIndex: 7 }, // index past the options
  { ...good, answerIndex: null }, // no answer at all
  { ...good, options: ["only one"] }, // nothing to choose between
  { ...good, question: null },
  { ...good, explanation: null },
  // A blank option would shift `answerIndex` onto the wrong choice if it were filtered
  // out, so the whole question goes.
  { ...good, options: ["a", null, "b"], answerIndex: 2 },
  { ...good, options: ["a", "   ", "b"], answerIndex: 2 },
  { ...good, startSeconds: null }, // no moment is fine — it just cannot offer one
]);
assert.equal(usable.length, 2);
assert.deepEqual(usable[0].options, good.options);
assert.equal(usable[1].startSeconds, null);

const result = grade(usable, [0, null]);
assert.equal(result.total, 2);
assert.equal(result.correct, 1);
assert.equal(result.percent, 50);
assert.deepEqual(
  result.graded.map((entry) => entry.isCorrect),
  [true, false],
);
// A skipped question is wrong, not unanswered-and-ignored.
assert.equal(result.graded[1].chosen, null);

// All wrong, and the empty case.
assert.equal(grade(usable, [1, 1]).percent, 0);
assert.deepEqual(grade([], []), { correct: 0, total: 0, percent: 0, graded: [] });

console.log("quiz: ok");
