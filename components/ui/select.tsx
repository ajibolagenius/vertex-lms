import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({
  label,
  options,
  className,
  id = "select",
  ...props
}: {
  label: string;
  options: string[];
} & ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        className={cn(
          "h-9 w-full appearance-none rounded-sm border border-line bg-surface",
          "px-3 pr-9 text-[14px] font-medium text-ink",
          "hover:border-line-strong focus:border-accent focus:outline-none",
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}
