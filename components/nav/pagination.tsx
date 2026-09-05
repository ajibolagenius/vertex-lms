import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** 1, 2, 3, …, total — the shape shown in the design sheet. */
function pageItems(total: number): (number | "ellipsis")[] {
  if (total <= 4) return Array.from({ length: total }, (_, i) => i + 1);
  return [1, 2, 3, "ellipsis", total];
}

const box =
  "inline-flex size-9 items-center justify-center rounded-sm text-[14px] leading-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500";

export function Pagination({
  page,
  totalPages,
  hrefFor = (p) => `?page=${p}`,
  className,
}: {
  page: number;
  totalPages: number;
  hrefFor?: (page: number) => string;
  className?: string;
}) {
  return (
    <nav aria-label="Pagination" className={className}>
      <ul className="flex items-center gap-1">
        <li>
          <Link
            href={hrefFor(Math.max(1, page - 1))}
            aria-label="Previous page"
            aria-disabled={page === 1 || undefined}
            className={cn(box, "text-neutral-500 hover:text-neutral-900")}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Link>
        </li>
        {pageItems(totalPages).map((item, i) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${i}`} className={cn(box, "text-neutral-500")}>
              &hellip;
            </li>
          ) : (
            <li key={item}>
              <Link
                href={hrefFor(item)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  box,
                  item === page
                    ? "border border-primary-500 font-medium text-primary-500"
                    : "text-neutral-700 hover:text-primary-500",
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        <li>
          <Link
            href={hrefFor(Math.min(totalPages, page + 1))}
            aria-label="Next page"
            aria-disabled={page === totalPages || undefined}
            className={cn(box, "text-neutral-500 hover:text-neutral-900")}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </li>
      </ul>
    </nav>
  );
}
