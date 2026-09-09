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

/**
 * `765` → `"12:45"`, `512` → `"08:32"`, `4210` → `"1:10:10"`. For a clip length or a
 * matched moment. Minutes are zero-padded, as the search reference draws them.
 */
export function formatTimestamp(seconds: number | null | undefined): string {
  const total = Math.max(0, Math.floor(seconds ?? 0));
  const pad = (value: number) => String(value).padStart(2, "0");
  const mmss = `${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
  return total < 3600 ? mmss : `${Math.floor(total / 3600)}:${mmss}`;
}

/** `(4, 0)` → `"5.1"`. Positional, from array order — never stored (AGENTS §8). */
export function lessonLabel(moduleIndex: number, lessonIndex: number): string {
  return `${moduleIndex + 1}.${lessonIndex + 1}`;
}
