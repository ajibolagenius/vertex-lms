import Link from "next/link";
import { FileText, SquareArrowOutUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ResourceCard({
  title,
  description,
  fileType,
  fileSize,
  href,
  className,
}: {
  title: string;
  description: string;
  fileType: string;
  fileSize: string;
  href: string;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-4", className)}>
      <div className="flex gap-3">
        <FileText
          size={24}
          aria-hidden="true"
          className="shrink-0 text-neutral-700"
        />
        <div className="min-w-0">
          <h3 className="text-[16px] leading-[24px] font-semibold text-neutral-900">
            {title}
          </h3>
          <p className="mt-1 text-body text-neutral-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
        <span className="text-[12px] leading-[16px] text-neutral-500">
          {fileType} &middot; {fileSize}
        </span>
        <Link
          href={href}
          aria-label={`Open ${title}`}
          className="text-primary-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <SquareArrowOutUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
