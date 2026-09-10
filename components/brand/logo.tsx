import { cn } from "@/lib/utils";

export function LogoMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  /* A vertex: two strokes meeting at a point, with the descent picked out. */
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M3 5.5 16 28 29 5.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
      />
      <circle cx="16" cy="28" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} className="text-accent" />
      {/* Mark only on the narrowest screens, so headers keep room for their actions. */}
      <span className="hidden text-[17px] leading-6 font-semibold tracking-[-0.03em] text-ink sm:inline">
        Vertex
      </span>
    </span>
  );
}
