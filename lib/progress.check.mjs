/** Self-check for the progress grouping: `npm run check:progress`. */
import assert from "node:assert/strict";

import { groupByCourse } from "./progress.ts";

const course = (slug, lessonIds) => ({ title: slug, slug, lessonIds });
const lesson = (slug) => ({ title: slug, slug });

// Newest first, as the query orders them.
const records = [
  {
    updatedAt: "2026-09-02T00:00:00Z",
    completed: false,
    positionSeconds: 90,
    quizScore: 50,
    lesson: lesson("b2"),
    course: course("beta", ["b1", "b2"]),
  },
  {
    updatedAt: "2026-09-01T00:00:00Z",
    completed: true,
    quizScore: 100,
    lesson: lesson("b1"),
    course: course("beta", ["b1", "b2"]),
  },
  {
    updatedAt: "2026-08-30T00:00:00Z",
    completed: true,
    lesson: lesson("a1"),
    course: course("alpha", ["a1"]),
  },
];

const [beta, alpha] = groupByCourse(records);

// Most recently touched course leads.
assert.equal(beta.slug, "beta");
assert.equal(beta.completedCount, 1);
assert.equal(beta.totalCount, 2);
assert.equal(beta.percent, 50);
// Quiz results are per lesson; the course shows how many and their mean.
assert.equal(beta.quizzesTaken, 2);
assert.equal(beta.quizAverage, 75);
assert.equal(alpha.quizzesTaken, 0);
assert.equal(alpha.quizAverage, null);
// Resume picks the newest incomplete lesson and carries its position.
assert.deepEqual(beta.resume, {
  title: "b2",
  slug: "b2",
  href: "/lessons/b2?t=90",
  positionSeconds: 90,
});

// Every lesson done: 100% and nothing to resume.
assert.equal(alpha.percent, 100);
assert.equal(alpha.resume, null);

// No position stored: a bare lesson link, not "?t=0".
assert.equal(
  groupByCourse([
    { updatedAt: "2026-09-03T00:00:00Z", lesson: lesson("c1"), course: course("gamma", ["c1"]) },
  ])[0].resume.href,
  "/lessons/c1",
);

// A lesson no course references any more has nowhere to link, so it is dropped.
assert.deepEqual(groupByCourse([{ lesson: lesson("x"), course: null }]), []);

// A course listing more lessons than the learner has touched still reads its true total.
assert.equal(
  groupByCourse([
    { updatedAt: "1", completed: true, lesson: lesson("d1"), course: course("delta", ["d1", "d2", "d3"]) },
  ])[0].percent,
  33,
);

console.log("progress.check.mjs ok");
