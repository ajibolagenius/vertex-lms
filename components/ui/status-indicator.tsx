import { CircleCheck, LoaderCircle, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type Status = "in-progress" | "completed" | "now-playing" | "locked";

const config = {
  "in-progress": {
    Icon: LoaderCircle,
    label: "In Progress",
    tone: "text-primary-500",
  },
  completed: { Icon: CircleCheck, label: "Completed", tone: "text-success" },
  locked: { Icon: Lock, label: "Locked", tone: "text-neutral-500" },
} as const;

/** Now Playing is a solid orange disc with a white glyph, so it is drawn, not iconed. */
function NowPlayingMark() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary-500"
    >
      <Play size={8} className="translate-x-px fill-white text-white" />
    </span>
  );
}

export function StatusIndicator({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const wrapper = cn(
    "inline-flex items-center gap-2 text-[12px] leading-[16px] text-neutral-700",
    className,
  );

  if (status === "now-playing") {
    return (
      <span className={wrapper}>
        <NowPlayingMark />
        Now Playing
      </span>
    );
  }

  const { Icon, label, tone } = config[status];
  return (
    <span className={wrapper}>
      <Icon size={16} aria-hidden="true" className={cn("shrink-0", tone)} />
      {label}
    </span>
  );
}
