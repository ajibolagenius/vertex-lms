"use client";

import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The lesson's panel switch. Panels are rendered on the server and passed in, so the
 * only client state is which one is visible.
 *
 * The Notes tab is presentational (AGENTS §7) — there is nowhere to store a learner's
 * notes yet, so it shows an empty state rather than a disabled input.
 */
export function LessonTabs({ content }: { content: ReactNode }) {
  const [active, setActive] = useState(0);
  const tabs = ["Overview", "Notes"];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Lesson"
        className="flex items-center gap-1 border-b border-line"
        onKeyDown={(event) => {
          const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
          if (!step) return;
          event.preventDefault();
          const next = (active + step + tabs.length) % tabs.length;
          setActive(next);
          document.getElementById(`lesson-tab-${next}`)?.focus();
        }}
      >
        {tabs.map((label, index) => (
          <button
            key={label}
            id={`lesson-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls={`lesson-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            className={cn(
              "-mb-px border-b px-3 pb-2.5 text-meta transition-colors",
              active === index
                ? "border-accent text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div id="lesson-panel-0" role="tabpanel" aria-labelledby="lesson-tab-0" hidden={active !== 0}>
        {content}
      </div>
      <div
        id="lesson-panel-1"
        role="tabpanel"
        aria-labelledby="lesson-tab-1"
        hidden={active !== 1}
        className="py-12"
      >
        <p className="text-body text-ink-muted">Your notes for this lesson will appear here.</p>
      </div>
    </div>
  );
}
