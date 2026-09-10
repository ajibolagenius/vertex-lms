import Link from "next/link";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/** Mono and slash-separated, so it reads as a path rather than as prose. */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-data text-ink-muted">
        {/* Keyed by position: two crumbs can share a label — a lesson whose title
            matches its module's — and the list is static per render, never reordered. */}
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-ink">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn("max-w-[40ch] truncate", isLast && "text-ink")}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="text-ink-disabled">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
