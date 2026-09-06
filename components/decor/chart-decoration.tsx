import { cn } from "@/lib/utils";

/** Heights, as a percentage of the strip, of the decorative bar graphic. */
const bars = [40, 58, 76, 92, 68, 52, 0, 0, 46, 58, 78, 94, 50, 68, 86];

/** The blurred orange bars that close the home and course pages. Decorative only. */
export function ChartDecoration({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("h-[190px] overflow-hidden", className)}>
      <div className="flex h-full items-end gap-1.5 blur-[5px]">
        {bars.map((height, i) => (
          <span
            key={i}
            style={{ height: `${height}%` }}
            className="flex-1 bg-gradient-to-t from-primary-400/85 to-transparent"
          />
        ))}
      </div>
    </div>
  );
}
