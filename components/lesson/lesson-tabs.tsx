"use client";

import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

const TABS = ["Lesson Content", "Notes"] as const;

/**
 * The lesson content / notes switch. Panels are rendered on the server and passed
 * in, so the only client state is which one is visible.
 *
 * The Notes tab is presentational (AGENTS §7) — there is nowhere to store a
 * learner's notes yet, so it shows an empty state rather than a disabled input.
 */
export function LessonTabs({ content }: { content: ReactNode }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Lesson"
        className="flex items-center gap-6 border-b border-line"
        onKeyDown={(event) => {
          const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
          if (!step) return;
          event.preventDefault();
          const next = (active + step + TABS.length) % TABS.length;
          setActive(next);
          document.getElementById(`lesson-tab-${next}`)?.focus();
        }}
      >
        {TABS.map((label, index) => (
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
              "-mb-px border-b-2 pb-3.5 text-[15px] leading-[22px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
              active === index
                ? "border-primary-500 font-semibold text-primary-500"
                : "border-transparent text-neutral-500 hover:text-neutral-900",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        id="lesson-panel-0"
        role="tabpanel"
        aria-labelledby="lesson-tab-0"
        hidden={active !== 0}
      >
        {content}
      </div>
      <div
        id="lesson-panel-1"
        role="tabpanel"
        aria-labelledby="lesson-tab-1"
        hidden={active !== 1}
        className="py-12 text-center"
      >
        <p className="text-[15px] leading-[23px] text-neutral-500">
          Your notes for this lesson will appear here.
        </p>
      </div>
    </div>
  );
}
