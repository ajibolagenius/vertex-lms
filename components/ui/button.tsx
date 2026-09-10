import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Signal buttons: one accent fill, one outline, one quiet fill, one link.
 * Borders and fills carry the hierarchy — there are no button shadows.
 *
 * Icons are passed in by the caller. An earlier version injected one per variant,
 * which meant a "Play" button could not be a "Save" button.
 */

const base = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium",
  "transition-colors disabled:cursor-not-allowed disabled:pointer-events-none",
].join(" ");

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "text";
export type ButtonSize = "xl" | "lg" | "md";
/** `hover` and `disabled` render the state statically, for the design-system sheet. */
export type ButtonState = "default" | "hover" | "disabled";

const variants: Record<ButtonVariant, Record<ButtonState, string>> = {
  primary: {
    default: "bg-accent text-on-accent hover:bg-accent-hover",
    hover: "bg-accent-hover text-on-accent",
    disabled: "bg-raised text-ink-disabled",
  },
  secondary: {
    default: "border border-line-strong text-ink bg-surface hover:border-ink hover:bg-raised",
    hover: "border border-ink text-ink bg-raised",
    disabled: "border border-line text-ink-disabled bg-surface",
  },
  tertiary: {
    default: "bg-raised text-ink hover:bg-line",
    hover: "bg-line text-ink",
    disabled: "bg-raised text-ink-disabled",
  },
  text: {
    default: "text-accent underline-offset-4 hover:underline",
    hover: "text-accent underline underline-offset-4",
    disabled: "text-ink-disabled",
  },
};

const sizes: Record<ButtonSize, string> = {
  xl: "h-14 px-6 text-[16px]",
  lg: "h-11 px-4 text-[15px]",
  md: "h-9 px-3 text-[14px]",
};

/** Same surface as `Button`, for a call to action that navigates. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "lg",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        base,
        variant === "text" ? "h-auto" : sizes[size],
        variants[variant].default,
        className,
      )}
    >
      {children}
    </Link>
  );
}

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
        base,
        // The text variant has no surface: no height, no padding, size only.
        variant === "text"
          ? cn("h-auto", size === "md" ? "text-[14px]" : "text-[15px]")
          : sizes[size],
        variants[variant][state],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
