/** Self-check for the transcript grouping: `npm run check:transcript`. */
import assert from "node:assert/strict";

import { activeSeconds, groupByChapter, toLines } from "./transcript.ts";

const lines = toLines([
  { _key: "d", startSeconds: 40, text: "fourth" },
  { _key: "a", startSeconds: 0, text: "first" },
  { _key: "x", startSeconds: null, text: "no timestamp" },
  { _key: "b", startSeconds: 20, text: "second" },
  { _key: "c", startSeconds: 30, text: "" },
  // Two captions can land in the same second; their keys are what stay unique.
  { _key: "b2", startSeconds: 20, text: "second, continued" },
]);

// Ordered, and the incomplete chunks are gone.
assert.deepEqual(
  lines.map((line) => line.seconds),
  [0, 20, 20, 40],
);
// Keys survive, and stay unique even where the seconds collide.
assert.equal(new Set(lines.map((line) => line.key)).size, lines.length);

// No chapters: one unlabelled group holding everything.
const flat = groupByChapter([], lines);
assert.equal(flat.length, 1);
assert.equal(flat[0].label, null);
assert.equal(flat[0].lines.length, 4);
assert.deepEqual(groupByChapter([], []), []);

// Chapters starting after the transcript does: the lead run keeps its own group.
const grouped = groupByChapter(
  [
    { _key: "c2", startSeconds: 30, label: "Second half" },
    { _key: "c1", startSeconds: 15, label: "First half" },
    { _key: "c3", startSeconds: 60, label: "Never reached" },
    { _key: "c0", startSeconds: null, label: "Broken" },
  ],
  lines,
);
assert.deepEqual(
  grouped.map((group) => [group.label, group.lines.map((line) => line.seconds)]),
  [
    [null, [0]],
    ["First half", [20, 20]],
    ["Second half", [40]],
  ],
);

// The line being spoken is the last one that has started.
assert.equal(activeSeconds(lines, 0), 0);
assert.equal(activeSeconds(lines, 25), 20);
// Group keys are unique too, so the panel can key its sections by them.
assert.equal(new Set(grouped.map((group) => group.key)).size, grouped.length);
assert.equal(activeSeconds(lines, 5000), 40);
// Before the first line, and with nothing to show.
assert.equal(activeSeconds(lines, -1), 0);
assert.equal(activeSeconds([], 10), -1);

console.log("transcript: ok");
