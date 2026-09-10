import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The field the product is built around, at three sizes. Signal makes it the
 * loudest element on the home page, so `hero` is a full-width slab with a
 * visible border rather than a pill.
 */
export type SearchInputVariant = "md" | "page" | "hero";

const variants: Record<
  SearchInputVariant,
  { field: string; icon: number; iconPos: string; shortcut: string }
> = {
  md: {
    field: "h-9 rounded-sm pl-9 pr-14 text-[14px]",
    icon: 16,
    iconPos: "left-3",
    shortcut: "right-3 text-data text-ink-disabled",
  },
  /* The search results page. */
  page: {
    field: "h-12 rounded-sm pl-11 pr-[76px] text-[15px]",
    icon: 18,
    iconPos: "left-4",
    shortcut:
      "right-3 flex h-7 items-center rounded-xs border border-line bg-raised px-2 text-data text-ink-muted",
  },
  /* The home hero. */
  hero: {
    field:
      "h-16 rounded-md pl-14 pr-24 text-[16px] sm:h-[76px] sm:pl-16 sm:pr-28 sm:text-[18px]",
    icon: 22,
    iconPos: "left-5",
    shortcut:
      "right-4 flex h-9 items-center rounded-xs border border-line bg-raised px-3 text-data text-ink-muted sm:right-5",
  },
};

export function SearchInput({
  label = "Search",
  shortcut = "⌘K",
  variant = "md",
  className,
  id = "search",
  ...props
}: {
  label?: string;
  shortcut?: string;
  variant?: SearchInputVariant;
} & ComponentProps<"input">) {
  const spec = variants[variant];

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        size={spec.icon}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-muted",
          spec.iconPos,
        )}
      />
      <input
        id={id}
        type="search"
        placeholder="Search anything..."
        className={cn(
          "w-full border border-line bg-surface text-ink placeholder:text-ink-disabled",
          "hover:border-line-strong focus:border-accent",
          // The global :focus-visible ring would double up with the border here.
          "focus:outline-none",
          spec.field,
        )}
        {...props}
      />
      {shortcut && (
        <span
          aria-hidden="true"
          className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2", spec.shortcut)}
        >
          {shortcut}
        </span>
      )}
    </div>
  );
}
