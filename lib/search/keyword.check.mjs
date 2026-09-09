/** Self-check for the keyword search: `npm run check:keyword`. */
import assert from "node:assert/strict";

import { cardDescription, coverage, toHits, tokenize } from "./keyword.ts";

// Token-based and wildcarded (AGENTS §11), stopwords and one-character tokens dropped.
assert.deepEqual(tokenize("How do I fetch data?"), ["fetch*", "data*"]);
assert.deepEqual(tokenize("Server-Side Rendering"), ["server*", "side*", "rendering*"]);
assert.deepEqual(tokenize("the a in of"), []);
assert.deepEqual(tokenize(""), []);
// Duplicates collapse; case is normalised.
assert.deepEqual(tokenize("Cache cache CACHE"), ["cache*"]);
// Capped at 8 terms, so one long sentence cannot blow up the query.
assert.equal(tokenize("alpha beta gamma delta epsilon zeta eta theta iota kappa").length, 8);
// Stripped to alphanumerics, so a term can never carry pattern syntax of its own.
assert.deepEqual(tokenize('cache* || *[_type=="lesson"]'), ["cache*", "type*", "lesson*"]);

// The card description is the lesson's first paragraph, cut on a word boundary.
assert.equal(
  cardDescription("An agent is a loop.\n\nWhat this lesson covers\n\nMore prose"),
  "An agent is a loop.",
);
assert.equal(cardDescription(null), "");
const long = cardDescription(`${"word ".repeat(60)}end`);
assert.ok(long.length <= 156, `description too long: ${long.length}`);
assert.ok(long.endsWith("…"));
assert.ok(!long.includes("  "));

const base = {
  titleTerms: [],
  notesTerms: [],
  keyPointTerms: [],
  notesText: "Prose.",
  video: null,
};

// Coverage: how many of the learner's words the lesson accounts for, anywhere.
assert.equal(coverage({ ...base, _id: "c", title: "C" }), 0);
assert.equal(
  coverage({
    ...base,
    _id: "c",
    title: "C",
    titleTerms: ["data*"],
    // The same term in two fields is still one word covered.
    notesTerms: ["data*"],
    video: { videoTerms: ["fetch*"], chapterMoments: [], transcriptMoments: [] },
  }),
  2,
);

// A lesson matching one word of two never shows next to lessons matching both — that is
// what stops a broad term like "data*" smearing across the catalog.
assert.deepEqual(
  toHits([
    { ...base, _id: "both", title: "Both", titleTerms: ["data*"], notesTerms: ["fetch*"] },
    { ...base, _id: "one", title: "One", titleTerms: ["data*"] },
  ]).map((hit) => hit.lessonId),
  ["both"],
);
// A one-word query covers everything equally, so nothing is dropped.
assert.equal(
  toHits([
    { ...base, _id: "a", title: "A", titleTerms: ["data*"] },
    { ...base, _id: "b", title: "B", notesTerms: ["data*"] },
  ]).length,
  2,
);

// Specificity: a title hit outranks a notes hit (§11).
const ranked = toHits([
  { ...base, _id: "notes", title: "B", notesTerms: ["x*"] },
  { ...base, _id: "title", title: "A", titleTerms: ["x*"] },
]);
assert.deepEqual(
  ranked.map((hit) => hit.lessonId),
  ["title", "notes"],
);
assert.deepEqual(
  ranked.map((hit) => hit.rank),
  [1, 2],
);
// A text-only match is a lesson hit with no invented second.
assert.equal(ranked[0].kind, "lesson");
assert.equal(ranked[0].startSeconds, null);
assert.equal(ranked[0].momentSource, null);
assert.equal(ranked[0].reason, "Prose.");

// A real moment makes it a video hit. Chapters win over the transcript (§7).
const moments = toHits([
  {
    ...base,
    _id: "both",
    title: "Both",
    video: {
      videoTerms: ["x*"],
      chapterMoments: [{ startSeconds: 80 }],
      transcriptMoments: [{ startSeconds: 12 }],
    },
  },
]);
assert.equal(moments[0].kind, "video");
assert.equal(moments[0].startSeconds, 80);
assert.equal(moments[0].momentSource, "chapter");

// With no chapter match, the transcript is the backstop, and it says so.
const fallback = toHits([
  {
    ...base,
    _id: "transcript",
    title: "T",
    video: { videoTerms: ["x*"], chapterMoments: [], transcriptMoments: [{ startSeconds: 97 }] },
  },
]);
assert.equal(fallback[0].momentSource, "transcript");
assert.equal(fallback[0].startSeconds, 97);

// A moment list of nulls is not a moment.
const empty = toHits([
  {
    ...base,
    _id: "null-seconds",
    title: "N",
    video: { videoTerms: ["x*"], chapterMoments: [{ startSeconds: null }], transcriptMoments: null },
  },
]);
assert.equal(empty[0].kind, "lesson");
assert.equal(empty[0].startSeconds, null);

// Equal scores break on title, so two identical searches return the same order.
assert.deepEqual(
  toHits([
    { ...base, _id: "z", title: "Zebra", titleTerms: ["x*"] },
    { ...base, _id: "a", title: "Apple", titleTerms: ["x*"] },
  ]).map((hit) => hit.lessonId),
  ["a", "z"],
);

assert.deepEqual(toHits([]), []);

console.log("keyword search checks passed");
