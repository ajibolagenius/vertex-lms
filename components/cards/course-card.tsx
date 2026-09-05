import type { ReactNode } from "react";
import { ChartNoAxesColumn, Clock, File, Folder } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** `feature` is the catalog card: a 72px brand tile, a serif title and the meta row pinned down. */
export type CourseCardVariant = "compact" | "feature";

export function CourseCard({
  title,
  description,
  level,
  duration,
  modules,
  mark,
  variant = "compact",
  className,
}: {
  title: string;
  description: string;
  level: string;
  duration: string;
  modules: string;
  /** The brand tile. `feature` expects it to carry its own background. */
  mark?: ReactNode;
  variant?: CourseCardVariant;
  className?: string;
}) {
  const feature = variant === "feature";
  const iconSize = feature ? 13 : 14;
  const item = cn(
    "inline-flex items-center whitespace-nowrap",
    feature ? "gap-1" : "gap-1.5",
  );

  return (
    <Card
      tone={feature ? "paper" : "white"}
      className={cn("flex flex-col", feature ? "min-h-[400px] gap-7 p-6" : "gap-4", className)}
    >
      <div className={cn("flex", feature ? "flex-col gap-7" : "gap-3")}>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center font-semibold",
            feature
              ? "size-[72px]"
              : "size-10 rounded-sm bg-neutral-900 text-[18px] text-white",
          )}
        >
          {mark ?? title.charAt(0)}
        </span>
        <div className="min-w-0">
          <h3
            className={cn(
              "text-neutral-900",
              feature
                ? "font-display text-[22px] leading-[30px]"
                : "text-[16px] leading-[24px] font-semibold",
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "text-neutral-500",
              feature ? "mt-4 text-[14px] leading-[25px]" : "mt-1 text-body",
            )}
          >
            {description}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex flex-wrap items-center border-t leading-[16px] text-neutral-500",
          feature
            ? // The reference insets this row less than the rest of the card, so the three
              // items clear one line at the card's narrowest.
              "-mx-2 mt-auto gap-2 border-line pt-6 text-[11px]"
            : "gap-3 border-neutral-100 pt-4 text-[12px]",
        )}
      >
        <span className={item}>
          <ChartNoAxesColumn size={iconSize} aria-hidden="true" />
          {level}
        </span>
        <span className={item}>
          <Clock size={iconSize} aria-hidden="true" />
          {duration}
        </span>
        <span className={item}>
          {feature ? (
            <File size={iconSize} aria-hidden="true" />
          ) : (
            <Folder size={iconSize} aria-hidden="true" />
          )}
          {modules}
        </span>
      </div>
    </Card>
  );
}
