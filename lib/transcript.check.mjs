/** Self-check for the transcript grouping: `npm run check:transcript`. */
import assert from "node:assert/strict";

import { activeSeconds, groupByChapter, toLines } from "./transcript.ts";

const lines = toLines([
  { startSeconds: 40, text: "fourth" },
  { startSeconds: 0, text: "first" },
  { startSeconds: null, text: "no timestamp" },
  { startSeconds: 20, text: "second" },
  { startSeconds: 30, text: "" },
]);

// Ordered, and the incomplete chunks are gone.
assert.deepEqual(
  lines.map((line) => line.seconds),
  [0, 20, 40],
);

// No chapters: one unlabelled group holding everything.
const flat = groupByChapter([], lines);
assert.equal(flat.length, 1);
assert.equal(flat[0].label, null);
assert.equal(flat[0].lines.length, 3);
assert.deepEqual(groupByChapter([], []), []);

// Chapters starting after the transcript does: the lead run keeps its own group.
const grouped = groupByChapter(
  [
    { startSeconds: 30, label: "Second half" },
    { startSeconds: 15, label: "First half" },
    { startSeconds: 60, label: "Never reached" },
    { startSeconds: null, label: "Broken" },
  ],
  lines,
);
assert.deepEqual(
  grouped.map((group) => [group.label, group.lines.map((line) => line.seconds)]),
  [
    [null, [0]],
    ["First half", [20]],
    ["Second half", [40]],
  ],
);

// The line being spoken is the last one that has started.
assert.equal(activeSeconds(lines, 0), 0);
assert.equal(activeSeconds(lines, 25), 20);
assert.equal(activeSeconds(lines, 5000), 40);
// Before the first line, and with nothing to show.
assert.equal(activeSeconds(lines, -1), 0);
assert.equal(activeSeconds([], 10), -1);

console.log("transcript: ok");
