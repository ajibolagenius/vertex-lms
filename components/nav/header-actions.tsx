"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import posthog from "posthog-js";

export function HeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-4 sm:gap-5">
      <button
        type="button"
        aria-label="Notifications"
        className="rounded-full p-1 text-neutral-900 hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        onClick={() => posthog.capture("notification_bell_clicked")}
      >
        <Bell size={22} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox:
                "size-[50px] border border-line bg-primary-100",
              userButtonTrigger:
                "rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
            },
          }}
        />
      </Show>
      <Show when="signed-out">
        <div className="flex items-center gap-2 sm:gap-3">
          <SignInButton>
            <Button
              variant="secondary"
              size="md"
              onClick={() => posthog.capture("sign_in_clicked")}
            >
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button
              size="md"
              onClick={() => posthog.capture("sign_up_clicked")}
            >
              Sign up
            </Button>
          </SignUpButton>
        </div>
      </Show>
    </div>
  );
}
