import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchInput({
  label = "Search",
  shortcut = "⌘ K",
  className,
  id = "search",
  ...props
}: { label?: string; shortcut?: string } & ComponentProps<"input">) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
      />
      <input
        id={id}
        type="search"
        placeholder="Search anything..."
        className={cn(
          "h-11 w-full rounded-md border border-neutral-200 bg-white",
          "pl-11 pr-14 text-[14px] text-neutral-900 placeholder:text-neutral-500",
          "focus:border-primary-400 focus:outline-none",
        )}
        {...props}
      />
      {shortcut && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] leading-[16px] text-neutral-500"
        >
          {shortcut}
        </span>
      )}
    </div>
  );
}
