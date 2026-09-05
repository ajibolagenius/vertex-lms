import type { ComponentProps, ReactNode } from "react";
import { CirclePlay, SquareArrowOutUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "text";
export type ButtonSize = "lg" | "md";
/** `hover` and `disabled` render the state statically, for the design-system sheet. */
export type ButtonState = "default" | "hover" | "disabled";

const variants: Record<ButtonVariant, Record<ButtonState, string>> = {
  primary: {
    default: "bg-primary-500 text-white hover:bg-primary-600",
    hover: "bg-primary-600 text-white",
    disabled: "bg-primary-100 text-primary-300",
  },
  secondary: {
    default:
      "border border-primary-500 text-primary-500 bg-white hover:bg-primary-100",
    hover: "border border-primary-500 text-primary-500 bg-primary-100",
    disabled: "border border-primary-200 text-primary-300 bg-white",
  },
  tertiary: {
    default:
      "border border-neutral-200 text-neutral-900 bg-white hover:bg-neutral-50",
    hover: "border border-neutral-200 text-neutral-900 bg-neutral-50 shadow-sm",
    disabled: "border border-neutral-200 text-neutral-300 bg-white",
  },
  text: {
    default: "text-primary-500 hover:text-primary-600",
    hover: "text-primary-600",
    disabled: "text-primary-300",
  },
};

/* Button type is set explicitly (Inter Medium 14–16px), not from the type scale. */
const sizes: Record<ButtonSize, string> = {
  lg: "px-4 text-[16px]",
  md: "px-3 text-[14px]",
};

const icons: Partial<Record<ButtonVariant, ReactNode>> = {
  tertiary: <SquareArrowOutUpRight size={16} aria-hidden="true" />,
  text: <CirclePlay size={16} aria-hidden="true" />,
};

export function Button({
  variant = "primary",
  size = "lg",
  state = "default",
  className,
  children,
  ...props
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  state?: ButtonState;
} & ComponentProps<"button">) {
  return (
    <button
      disabled={state === "disabled" || props.disabled}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        "disabled:cursor-not-allowed disabled:pointer-events-none",
        // The text variant has no surface: no height, no padding, size only.
        variant === "text"
          ? cn("h-auto", size === "lg" ? "text-[16px]" : "text-[14px]")
          : sizes[size],
        variants[variant][state],
        className,
      )}
      {...props}
    >
      {children}
      {icons[variant]}
    </button>
  );
}
