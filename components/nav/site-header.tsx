import { Navbar, type NavItem } from "@/components/nav/navbar";
import { HeaderActions } from "@/components/nav/header-actions";

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
        <HeaderActions />
      </div>
    </header>
  );
}
