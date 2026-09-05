import { cn } from "@/lib/utils";

/** `paper` is the warm surface the home page uses; `white` is the design-system default. */
export type CardTone = "white" | "paper";

const tones: Record<CardTone, string> = {
  white: "border-neutral-200 bg-white",
  paper: "border-line bg-surface",
};

export function Card({
  tone = "white",
  className,
  children,
}: {
  tone?: CardTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border p-5 shadow-sm", tones[tone], className)}>
      {children}
    </div>
  );
}
