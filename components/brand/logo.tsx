import { cn } from "@/lib/utils";

export function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
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
        d="M4 6h24L16 27 4 6Zm5.6 3.2 6.4 11.2 6.4-11.2H9.6Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function Logo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} className="text-primary-500" />
      {/* Mark only on the narrowest screens, so headers keep room for their actions. */}
      <span className="hidden text-[22px] leading-[30px] font-bold tracking-tight text-neutral-900 sm:inline">
        Vertex
      </span>
    </span>
  );
}
