import { cn } from "@/lib/utils";

export type BadgeVariant = "video" | "lesson" | "popular";

const variants: Record<BadgeVariant, string> = {
  video: "bg-primary-100 text-primary-500 font-semibold",
  lesson: "bg-lesson-bg text-lesson-fg font-semibold",
  popular: "bg-primary-100 text-primary-500 font-semibold",
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
        "inline-flex items-center rounded-[6px] px-2 py-1",
        "text-[12px] leading-[16px] uppercase tracking-wider",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
