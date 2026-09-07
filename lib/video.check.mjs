/** Self-check for the video URL parser: `node lib/video.check.mjs`. */
import assert from "node:assert/strict";

import { startSecondsFrom, youtubeEmbedUrl, youtubeId } from "./video.ts";

assert.equal(youtubeId("https://www.youtube.com/watch?v=9602Yzvd7ik"), "9602Yzvd7ik");
assert.equal(youtubeId("https://youtu.be/9602Yzvd7ik?t=30"), "9602Yzvd7ik");
assert.equal(youtubeId("https://www.youtube.com/embed/9602Yzvd7ik"), "9602Yzvd7ik");
assert.equal(youtubeId("https://vimeo.com/12345"), null);
assert.equal(youtubeId("not a url"), null);
assert.equal(youtubeId(null), null);

assert.equal(
  youtubeEmbedUrl("abc123", 125),
  "https://www.youtube-nocookie.com/embed/abc123?autoplay=1&rel=0&start=125",
);
assert.equal(
  youtubeEmbedUrl("abc123"),
  "https://www.youtube-nocookie.com/embed/abc123?autoplay=1&rel=0",
);

assert.equal(startSecondsFrom("125"), 125);
assert.equal(startSecondsFrom("-4"), 0);
assert.equal(startSecondsFrom("abc"), 0);
assert.equal(startSecondsFrom(null), 0);

console.log("lib/video.ts ok");
