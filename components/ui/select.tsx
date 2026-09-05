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
          "h-11 w-full appearance-none rounded-md border border-neutral-200 bg-white",
          "px-4 pr-11 text-[14px] font-medium text-neutral-900",
          "focus:border-primary-400 focus:outline-none",
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700"
      />
    </div>
  );
}
