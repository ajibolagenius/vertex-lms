import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { Navbar, type NavItem } from "@/components/nav/navbar";
import { Button } from "@/components/ui/button";

const items: NavItem[] = [
  { label: "Courses", href: "/courses" },
  { label: "My Learning", href: "/my-learning" },
];

/**
 * The frame header. The bell is presentational (AGENTS §7); the account control is Clerk. Signed
 * in matches the reference design's 50px circle — signed out has no reference, so it reuses the
 * design-system button surfaces at the same row height.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="flex h-[97px] items-center justify-between gap-4 px-4 sm:gap-6 sm:px-10">
        <Navbar items={items} className="gap-4 sm:gap-8 lg:gap-[60px]" />
        <div className="flex shrink-0 items-center gap-4 sm:gap-5">
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-full p-1 text-neutral-900 hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
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
                <Button variant="secondary" size="md">
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size="md">Sign up</Button>
              </SignUpButton>
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
}
