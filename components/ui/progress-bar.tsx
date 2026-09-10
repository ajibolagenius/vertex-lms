import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  showLabel = true,
  className,
}: {
  /** 0–100 */
  value: number;
  showLabel?: boolean;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      {/* Tabular, so a column of percentages does not jitter as it updates. */}
      {showLabel && <span className="text-data text-ink-muted">{pct}%</span>}
    </div>
  );
}
