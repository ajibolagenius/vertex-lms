"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import posthog from "posthog-js";
import { cn } from "@/lib/utils";

/**
 * Light / dark switch. The attribute it writes is the same one the inline script
 * in `app/layout.tsx` sets before paint, and `localStorage` is what the two share.
 *
 * Until a learner touches this, nothing is stored and the OS preference wins — a
 * stored value only exists because someone chose it.
 */

const STORAGE_KEY = "vertex-theme";

/**
 * The attribute on `<html>` is the source of truth, not React state — the pre-paint
 * script writes it before React exists. Reading it as an external store keeps the two
 * in step and lets a second toggle on the page follow the first.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

const readTheme = () =>
  document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";

/** The server cannot know the theme; the store re-reads it right after hydration. */
const serverTheme = () => "light" as const;

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the choice holds for this page load and no further.
    }
    posthog.capture("theme_changed", { theme: next });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-sm border border-line",
        "text-ink-muted transition-colors hover:border-line-strong hover:text-ink",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun size={16} aria-hidden="true" />
      ) : (
        <Moon size={16} aria-hidden="true" />
      )}
    </button>
  );
}
