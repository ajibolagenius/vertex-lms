/**
 * The learner's current run of active days.
 *
 * Derived from the `updatedAt` on their existing progress records — no new storage.
 *
 * ponytail: a progress record keeps only its LAST touch, so a day whose lessons were all
 * touched again later leaves no trace. The streak is therefore a floor, never an
 * overstatement, which is the right direction to be wrong in. Recording a real activity
 * log is the upgrade if this ever needs to be exact.
 *
 * No `@/` aliases, so `streak.check.mjs` runs it under plain tsx.
 */

const DAY_MS = 86_400_000;

/** `2026-09-10T14:00:00Z` → `2026-09-10`. UTC, so a streak does not shift with travel. */
function day(value: string): string | null {
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? null : at.toISOString().slice(0, 10);
}

function shift(from: string, days: number): string {
  return new Date(Date.parse(`${from}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export type Streak = {
  /** Consecutive active days ending today, or yesterday if today is still empty. */
  days: number;
  activeToday: boolean;
};

/**
 * A streak survives an unfinished today: a learner who studied yesterday and has not
 * opened anything yet still has their run, and loses it only once a whole day passes.
 */
export function currentStreak(timestamps: (string | null | undefined)[], now: Date): Streak {
  const active = new Set(
    timestamps.filter((value): value is string => Boolean(value)).map(day).filter(Boolean) as string[],
  );

  const today = now.toISOString().slice(0, 10);
  const activeToday = active.has(today);
  let cursor = activeToday ? today : shift(today, -1);
  if (!active.has(cursor)) return { days: 0, activeToday };

  let days = 0;
  while (active.has(cursor)) {
    days += 1;
    cursor = shift(cursor, -1);
  }
  return { days, activeToday };
}
