import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Offline — Vertex",
  description: "You are currently offline.",
};

export default function OfflinePage() {
  return (
    <Shell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-raised text-ink-muted">
          <WifiOff size={24} aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-title text-ink">You are offline</h1>
        <p className="mt-2.5 max-w-md text-body text-ink-muted">
          Vertex requires an internet connection to stream video lessons and search transcripts.
          Check your network and try again.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-sm bg-accent px-5 text-body font-medium text-on-accent transition-colors hover:bg-accent-hover"
          >
            Retry connection
          </Link>
        </div>
      </div>
    </Shell>
  );
}
