/** Self-check for the streak: `npm run check:streak`. */
import assert from "node:assert/strict";

import { currentStreak } from "./streak.ts";

const now = new Date("2026-09-10T09:00:00Z");
const at = (date, time = "12:00:00") => `${date}T${time}Z`;

// Today plus the two days before it.
assert.deepEqual(
  currentStreak([at("2026-09-10"), at("2026-09-09"), at("2026-09-08")], now),
  { days: 3, activeToday: true },
);

// Several touches on the same day are one day.
assert.deepEqual(
  currentStreak([at("2026-09-10", "08:00:00"), at("2026-09-10", "22:00:00")], now),
  { days: 1, activeToday: true },
);

// An unfinished today does not end a run that includes yesterday.
assert.deepEqual(currentStreak([at("2026-09-09"), at("2026-09-08")], now), {
  days: 2,
  activeToday: false,
});

// A gap ends it: the day before yesterday alone is over.
assert.deepEqual(currentStreak([at("2026-09-08"), at("2026-09-07")], now), {
  days: 0,
  activeToday: false,
});

// Older activity beyond the gap is not counted.
assert.equal(
  currentStreak([at("2026-09-10"), at("2026-09-05"), at("2026-09-04")], now).days,
  1,
);

// A month boundary is just another day.
assert.equal(
  currentStreak(
    [at("2026-09-01"), at("2026-08-31"), at("2026-08-30")],
    new Date("2026-09-01T23:00:00Z"),
  ).days,
  3,
);

// Junk in, zero out.
assert.deepEqual(currentStreak([], now), { days: 0, activeToday: false });
assert.deepEqual(currentStreak([null, undefined, "not a date"], now), {
  days: 0,
  activeToday: false,
});

console.log("streak: ok");
