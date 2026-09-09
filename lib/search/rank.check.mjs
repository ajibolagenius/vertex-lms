/** Self-check for search grounding: `node lib/search/rank.check.mjs`. */
import assert from "node:assert/strict";

import { orderHits, sortResults, toResult } from "./rank.ts";

const lesson = {
  _id: "lesson-51",
  _createdAt: "2026-03-01T00:00:00Z",
  title: "Data Fetching in Server Components",
  slug: "nextjs-data-fetching",
  duration: 765,
  videoUrl: "https://www.youtube.com/watch?v=9602Yzvd7ik",
  keyPoints: ["Fetching strategies", null, "Caching techniques"],
  thumbnailRef: "image-abc-1280x720-jpg",
  course: {
    title: "Next.js for Production",
    slug: "nextjs-for-production",
    iconRef: "image-def-144x144-png",
    modules: [
      { title: "Routing", lessonIds: ["lesson-11", "lesson-12"] },
      { title: "Rendering", lessonIds: ["lesson-21"] },
      { title: "Server Actions", lessonIds: ["lesson-31"] },
      { title: "Caching", lessonIds: ["lesson-41"] },
      { title: "Data Fetching & Caching", lessonIds: ["lesson-50", "lesson-51"] },
    ],
  },
};

const hit = {
  lessonId: "lesson-51",
  kind: "video",
  reason: "The lesson covers server-side fetching.",
  rank: 1,
  startSeconds: null,
  momentSource: null,
};

// Positional label: 5th module, 2nd lesson (AGENTS §8 — never stored).
const video = toResult(hit, lesson);
assert.equal(video.kind, "video");
assert.equal(video.label, "5.2");
assert.equal(video.moduleTitle, "Data Fetching & Caching");
assert.equal(video.courseTitle, "Next.js for Production");
assert.deepEqual(video.keyPoints, ["Fetching strategies", "Caching techniques"]);

// No real moment → no `?t=`, and the card will read "Watch lesson" (§7).
assert.equal(video.startSeconds, null);
assert.equal(video.href, "/lessons/nextjs-data-fetching");

// A moment the model attributes to a real chapter survives and deep-links.
const moment = toResult(
  { ...hit, startSeconds: 765.9, momentSource: "chapter" },
  lesson,
);
assert.equal(moment.startSeconds, 765);
assert.equal(moment.href, "/lessons/nextjs-data-fetching?t=765");

// A second the model invented with no source is discarded, not rendered.
assert.equal(toResult({ ...hit, startSeconds: 400, momentSource: null }, lesson).startSeconds, null);

// A real moment outranks the model's `kind`: a transcript match makes it a video card.
const promoted = toResult(
  { ...hit, kind: "lesson", startSeconds: 90, momentSource: "transcript" },
  lesson,
);
assert.equal(promoted.kind, "video");
assert.equal(promoted.href, "/lessons/nextjs-data-fetching?t=90");

// A "video" hit on a lesson with no playable provider URL downgrades to a lesson card.
assert.equal(toResult(hit, { ...lesson, videoUrl: "https://vimeo.com/12345" }).kind, "lesson");
assert.equal(toResult(hit, { ...lesson, videoUrl: null }).kind, "lesson");

// A lesson not present in any module still renders, just without a label.
const orphan = toResult(hit, { ...lesson, course: { ...lesson.course, modules: [] } });
assert.equal(orphan.label, null);
assert.equal(orphan.moduleTitle, null);

// No slug means no page to link to.
assert.equal(toResult(hit, { ...lesson, slug: null }), null);

// Rank order wins regardless of the order the model listed hits in.
assert.deepEqual(
  orderHits([
    { ...hit, lessonId: "c", rank: 3 },
    { ...hit, lessonId: "a", rank: 1 },
    { ...hit, lessonId: "b", rank: 2 },
  ]).map((entry) => entry.lessonId),
  ["a", "b", "c"],
);

const results = [
  { ...video, lessonId: "short", durationSeconds: 100 },
  { ...video, lessonId: "none", durationSeconds: null },
  { ...video, lessonId: "long", durationSeconds: 900 },
];
const created = { short: "2026-01-01", none: "2026-06-01", long: "2026-03-01" };

assert.deepEqual(
  sortResults(results, "relevance", (id) => created[id]).map((entry) => entry.lessonId),
  ["short", "none", "long"],
);
// Shortest first, and a missing duration sorts last rather than as zero.
assert.deepEqual(
  sortResults(results, "duration", (id) => created[id]).map((entry) => entry.lessonId),
  ["short", "long", "none"],
);
assert.deepEqual(
  sortResults(results, "newest", (id) => created[id]).map((entry) => entry.lessonId),
  ["none", "long", "short"],
);

console.log("search grounding checks passed");
