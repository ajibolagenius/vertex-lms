"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";

export function HeaderActions({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center gap-2 sm:gap-3", className)}>
      <ThemeToggle />
      <button
        type="button"
        aria-label="Notifications"
        className="hidden size-9 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-raised hover:text-ink sm:inline-flex"
        onClick={() => posthog.capture("notification_bell_clicked")}
      >
        <Bell size={17} aria-hidden="true" />
      </button>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "size-8 border border-line",
              userButtonTrigger: "rounded-full",
            },
          }}
        />
      </Show>
      <Show when="signed-out">
        <div className="flex items-center gap-2">
          {/* Wrapped: Clerk clones its child, so the responsive class goes outside it. */}
          <span className="hidden sm:inline-flex">
            <SignInButton>
              <Button
                variant="text"
                size="md"
                onClick={() => posthog.capture("sign_in_clicked")}
              >
                Sign in
              </Button>
            </SignInButton>
          </span>
          <SignUpButton>
            <Button size="md" onClick={() => posthog.capture("sign_up_clicked")}>
              Sign up
            </Button>
          </SignUpButton>
        </div>
      </Show>
    </div>
  );
}
