import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The catalog card. One shape, dense: the brand tile and title up top, the summary
 * clamped, and a mono meta row on the baseline so a grid of cards lines up.
 *
 * `progress` is rendered only for a course the learner has started — it arrives from
 * the client-side progress read, so the card is `null`-tolerant by design.
 */
export function CourseCard({
  title,
  description,
  level,
  duration,
  lessons,
  mark,
  href,
  popular = false,
  progress = null,
  className,
}: {
  title: string;
  description: string;
  level: string;
  duration: string;
  lessons: string;
  mark?: ReactNode;
  href?: string;
  popular?: boolean;
  /** 0–100, or null when the learner has not started the course. */
  progress?: number | null;
  className?: string;
}) {
  const started = typeof progress === "number";

  const card = (
    <article
      className={cn(
        "flex h-full flex-col gap-4 rounded-md border border-line bg-surface p-5",
        href && "transition-colors group-hover:border-line-strong",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-raised text-heading-3 text-ink-muted">
          {mark ?? title.charAt(0)}
        </span>
        <h3 className="min-w-0 flex-1 text-heading-2 text-ink">{title}</h3>
        {popular && <span className="shrink-0 text-meta text-accent">Popular</span>}
      </div>

      <p className="line-clamp-3 text-body text-ink-muted">{description}</p>

      {started && (
        <div className="flex items-center gap-3">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </span>
          <span className="text-data text-ink-muted">{progress}%</span>
        </div>
      )}

      <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-4 text-data text-ink-muted">
        <span>{level}</span>
        <span aria-hidden="true" className="text-ink-disabled">
          ·
        </span>
        <span>{duration}</span>
        <span aria-hidden="true" className="text-ink-disabled">
          ·
        </span>
        <span>{lessons}</span>
      </p>
    </article>
  );

  if (!href) return card;
  return (
    <Link href={href} className="group block h-full rounded-md">
      {card}
    </Link>
  );
}
