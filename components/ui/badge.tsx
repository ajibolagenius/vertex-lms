import { cn } from "@/lib/utils";

/**
 * The two search result kinds get the system's two hues — a matched video moment
 * is `moment`, a lesson is `accent`. Everything else is quiet.
 */
export type BadgeVariant = "video" | "lesson" | "popular";

const variants: Record<BadgeVariant, string> = {
  video: "bg-moment-soft text-moment",
  lesson: "bg-accent-soft text-accent",
  popular: "bg-raised text-ink-muted",
};

export function Badge({
  variant,
  children,
  className,
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs px-2 py-1 text-meta",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
