import assert from "node:assert/strict";
import {
  isValidSanityId,
  slugify,
  isCollectionOwner,
  toggleLessonRef,
} from "./collections.ts";

// 1. Sanity ID validation
assert.equal(isValidSanityId("lesson.123"), true);
assert.equal(isValidSanityId("collection.user_abc.xyz-123"), true);
assert.equal(isValidSanityId("invalid id with spaces"), false);
assert.equal(isValidSanityId("bad/path"), false);

// 2. Slugify
assert.equal(slugify("Next.js App Router 101!"), "next-js-app-router-101");
assert.equal(slugify("  My Saved Lessons  "), "my-saved-lessons");
assert.equal(slugify("!!!"), "collection");

// 3. Ownership checking
assert.equal(isCollectionOwner("user_123", "user_123"), true);
assert.equal(isCollectionOwner("user_123", "user_456"), false);
assert.equal(isCollectionOwner(null, "user_123"), false);
assert.equal(isCollectionOwner(undefined, "user_123"), false);
assert.equal(isCollectionOwner("user_123", null), false);

// 4. Toggle lesson reference
const initial = [
  { _ref: "lesson-1", _key: "k1" },
  { _ref: "lesson-2", _key: "k2" },
];

// Add lesson-3
const added = toggleLessonRef(initial, "lesson-3", () => "k3");
assert.equal(added.isSaved, true);
assert.equal(added.nextLessons.length, 3);
assert.equal(added.nextLessons[2]._ref, "lesson-3");
assert.equal(added.nextLessons[2]._key, "k3");

// Remove lesson-2
const removed = toggleLessonRef(initial, "lesson-2");
assert.equal(removed.isSaved, false);
assert.equal(removed.nextLessons.length, 1);
assert.equal(removed.nextLessons[0]._ref, "lesson-1");

console.log("collections: ok");
