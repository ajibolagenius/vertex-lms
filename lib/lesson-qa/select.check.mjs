/** Self-check for the excerpt selection: `npm run check:lesson-qa`. */
import assert from "node:assert/strict";

import { selectExcerpts } from "./select.ts";

const chunk = (seconds, text) => ({ startSeconds: seconds, text });

// Short transcripts go through whole — nothing to choose between.
const short = [chunk(0, "intro"), chunk(10, "middle"), chunk(20, "end")];
assert.deepEqual(
  selectExcerpts("anything", short, 20).map((e) => e.seconds),
  [0, 10, 20],
);

// Incomplete chunks are dropped before anything is scored.
assert.deepEqual(
  selectExcerpts("x", [chunk(null, "no time"), chunk(5, ""), chunk(1, "keep")], 20),
  [{ seconds: 1, text: "keep" }],
);

const long = Array.from({ length: 40 }, (_, i) => chunk(i * 10, `filler ${i}`));
long[7] = chunk(70, "the cache is revalidated by tag");
long[3] = chunk(30, "revalidate on a timer");

const picked = selectExcerpts("How does cache revalidation work?", long, 3);
// The scoring hit is in — matching is whole-token, so "revalidation" does not reach
// "revalidate" at 30s — and the rest of the budget is spread over the video.
assert.ok(picked.some((e) => e.seconds === 70));
assert.equal(picked.length, 3);
// Always in playback order, whatever the scores were.
assert.deepEqual(
  [...picked].sort((a, b) => a.seconds - b.seconds),
  picked,
);

// A question that matches nothing still sees the shape of the whole video.
const spread = selectExcerpts("zzzz", long, 4);
assert.equal(spread.length, 4);
assert.equal(spread[0].seconds, 0);
assert.ok(spread[3].seconds > spread[0].seconds);

// The cap is honoured even when everything matches.
assert.equal(selectExcerpts("filler", long, 5).length, 5);
// And a wider budget than the transcript has is not padded with duplicates.
assert.equal(new Set(selectExcerpts("filler", long, 40).map((e) => e.seconds)).size, 40);

console.log("lesson-qa select: ok");
