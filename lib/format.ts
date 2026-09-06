/** Display formatting for stored values. Durations are stored in seconds (AGENTS §8). */

/** `65040` → `"18h 4m"`, `2700` → `"45m"`. */
export function formatDuration(seconds: number | null | undefined): string {
  const total = Math.max(0, Math.round((seconds ?? 0) / 60));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

/** `2100` → `"2.1k"`, `18240` → `"18.2k"`, `940` → `"940"`. */
export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  const thousands = value / 1000;
  return `${thousands < 100 ? thousands.toFixed(1).replace(/\.0$/, "") : Math.round(thousands)}k`;
}

/** `"intermediate"` → `"Intermediate"`. */
export function formatLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/** `"12 modules"`, `"1 module"`. */
export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
