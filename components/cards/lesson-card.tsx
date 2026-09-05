import Link from "next/link";
import { SquareArrowOutUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LessonCard({
  title,
  description,
  moduleLabel,
  href,
  className,
}: {
  title: string;
  description: string;
  moduleLabel: string;
  href: string;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <Badge variant="lesson" className="self-start">
        Lesson
      </Badge>
      <h3 className="text-[16px] leading-[24px] font-semibold text-neutral-900">
        {title}
      </h3>
      <p className="text-body text-neutral-500">{description}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
        <span className="text-[12px] leading-[16px] text-neutral-500">
          {moduleLabel}
        </span>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-[12px] leading-[16px] font-semibold text-primary-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          View lesson
          <SquareArrowOutUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
