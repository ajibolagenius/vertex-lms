import type { ReactNode } from "react";
import { SiteHeader } from "@/components/nav/site-header";
import { cn } from "@/lib/utils";

/**
 * Every page's frame: the sticky header, then a 1240px column on the plain canvas.
 * The old design's hatched gutters and bordered 1440px envelope are gone — Signal
 * puts the content on the ground and lets the hairlines do the structuring.
 *
 * `bleed` is for the lesson workspace, which runs its own full-width columns.
 */
export function Shell({
  children,
  className,
  bleed = false,
  showSearch = true,
}: {
  children: ReactNode;
  className?: string;
  bleed?: boolean;
  /** The home page turns the header field off — its hero field is the search. */
  showSearch?: boolean;
}) {
  return (
    <div className="flex-1">
      <SiteHeader showSearch={showSearch} />
      <main
        className={cn(
          bleed ? "w-full" : "mx-auto w-full max-w-[1240px] px-5 pb-24 sm:px-8",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
