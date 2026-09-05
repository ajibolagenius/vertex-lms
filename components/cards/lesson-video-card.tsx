import Link from "next/link";
import { CirclePlay } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LessonVideoCard({
  title,
  description,
  lessonLabel,
  duration,
  startLabel,
  href,
  className,
}: {
  title: string;
  description: string;
  lessonLabel: string;
  duration: string;
  startLabel: string;
  href: string;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <Badge variant="video" className="self-start">
        Video
      </Badge>
      <h3 className="text-[16px] leading-[24px] font-semibold text-neutral-900">
        {title}
      </h3>
      <p className="text-body text-neutral-500">{description}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
        <span className="text-[12px] leading-[16px] text-neutral-500">
          {lessonLabel} &middot; {duration}
        </span>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-[12px] leading-[16px] font-semibold text-primary-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <CirclePlay size={14} aria-hidden="true" />
          {startLabel}
        </Link>
      </div>
    </Card>
  );
}
