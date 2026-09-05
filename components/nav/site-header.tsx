import { Bell } from "lucide-react";
import { Navbar, type NavItem } from "@/components/nav/navbar";

const items: NavItem[] = [
  { label: "Courses", href: "/courses" },
  { label: "My Learning", href: "/my-learning" },
];

/**
 * The frame header. The bell and the avatar are presentational (AGENTS §7) — Clerk supplies the
 * real user later.
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
          <span
            aria-label="Your account"
            role="img"
            className="flex size-[50px] items-center justify-center rounded-full border border-line bg-primary-100 text-[15px] font-medium text-primary-500"
          >
            AA
          </span>
        </div>
      </div>
    </header>
  );
}
