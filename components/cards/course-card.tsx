import type { ReactNode } from "react";
import { ChartNoAxesColumn, Clock, Folder } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CourseCard({
  title,
  description,
  level,
  duration,
  modules,
  mark,
  className,
}: {
  title: string;
  description: string;
  level: string;
  duration: string;
  modules: string;
  mark?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-4", className)}>
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-neutral-900 text-[18px] font-semibold text-white">
          {mark ?? title.charAt(0)}
        </span>
        <div className="min-w-0">
          <h3 className="text-[16px] leading-[24px] font-semibold text-neutral-900">
            {title}
          </h3>
          <p className="mt-1 text-body text-neutral-500">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4 text-[12px] leading-[16px] text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <ChartNoAxesColumn size={14} aria-hidden="true" />
          {level}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} aria-hidden="true" />
          {duration}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Folder size={14} aria-hidden="true" />
          {modules}
        </span>
      </div>
    </Card>
  );
}
