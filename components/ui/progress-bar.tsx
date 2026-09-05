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
    <div className={cn("flex items-center gap-4", className)}>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100"
      >
        <div
          className="h-full rounded-full bg-primary-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[12px] leading-[16px] font-semibold text-neutral-900">
          {pct}% complete
        </span>
      )}
    </div>
  );
}
