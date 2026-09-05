import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchInputVariant = "md" | "hero";

const variants: Record<
  SearchInputVariant,
  { field: string; icon: number; iconPos: string; shortcut: string }
> = {
  md: {
    field: "h-11 rounded-md pl-11 pr-14 text-[14px]",
    icon: 18,
    iconPos: "left-4",
    shortcut: "right-4 text-[12px] leading-[16px] text-neutral-500",
  },
  /* The home hero: 86px tall, with the ⌘K hint drawn as a boxed key chip. */
  hero: {
    field:
      "h-16 rounded-[14px] pl-14 pr-24 text-[15px] sm:h-[86px] sm:pl-[72px] sm:pr-[104px] sm:text-[17px]",
    icon: 26,
    iconPos: "left-5 sm:left-6",
    shortcut:
      "right-4 flex h-10 items-center rounded-lg border border-line bg-white px-3 text-[13px] text-neutral-500 sm:right-6 sm:px-4",
  },
};

export function SearchInput({
  label = "Search",
  shortcut = "⌘ K",
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
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-neutral-500",
          spec.iconPos,
        )}
      />
      <input
        id={id}
        type="search"
        placeholder="Search anything..."
        className={cn(
          "w-full border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-500",
          "focus:border-primary-400 focus:outline-none",
          spec.field,
        )}
        {...props}
      />
      {shortcut && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2",
            spec.shortcut,
          )}
        >
          {shortcut}
        </span>
      )}
    </div>
  );
}
