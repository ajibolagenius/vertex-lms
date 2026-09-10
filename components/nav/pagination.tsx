import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** 1, 2, 3, …, total. */
function pageItems(total: number): (number | "ellipsis")[] {
  if (total <= 4) return Array.from({ length: total }, (_, i) => i + 1);
  return [1, 2, 3, "ellipsis", total];
}

const box = "inline-flex size-8 items-center justify-center rounded-xs text-data";

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
            className={cn(box, "text-ink-muted hover:bg-raised hover:text-ink")}
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </Link>
        </li>
        {pageItems(totalPages).map((item, i) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${i}`} className={cn(box, "text-ink-disabled")}>
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
                    ? "bg-ink text-canvas"
                    : "text-ink-muted hover:bg-raised hover:text-ink",
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
            className={cn(box, "text-ink-muted hover:bg-raised hover:text-ink")}
          >
            <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </li>
      </ul>
    </nav>
  );
}
