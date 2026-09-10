import { CircleCheck, CirclePause, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type Status = "in-progress" | "completed" | "now-playing" | "locked";

const config = {
  "in-progress": { Icon: CirclePause, label: "In progress", tone: "text-ink-muted" },
  completed: { Icon: CircleCheck, label: "Completed", tone: "text-success" },
  locked: { Icon: Lock, label: "Locked", tone: "text-ink-disabled" },
} as const;

/** Now playing is the one solid mark in the set, so it is drawn rather than iconed. */
function NowPlayingMark() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-accent"
    >
      <Play size={8} className="translate-x-px fill-on-accent text-on-accent" />
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
  const wrapper = cn("inline-flex items-center gap-2 text-small text-ink-muted", className);

  if (status === "now-playing") {
    return (
      <span className={wrapper}>
        <NowPlayingMark />
        <span className="text-ink">Now playing</span>
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
