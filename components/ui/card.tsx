import { cn } from "@/lib/utils";

/** `surface` sits on the canvas; `raised` is the inset fill for a panel inside a card. */
export type CardTone = "white" | "paper";

const tones: Record<CardTone, string> = {
  white: "border-line bg-surface",
  paper: "border-line bg-raised",
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
  /* Border, not shadow — see the shape notes in globals.css. */
  return (
    <div className={cn("rounded-md border p-5", tones[tone], className)}>{children}</div>
  );
}
