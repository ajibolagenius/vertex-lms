import { Navbar, type NavItem } from "@/components/nav/navbar";
import { HeaderActions } from "@/components/nav/header-actions";
import { SearchForm } from "@/components/search/search-form";

const items: NavItem[] = [
  { label: "Courses", href: "/courses" },
  { label: "My Learning", href: "/my-learning" },
];

/**
 * Sticky, quiet, and one hairline deep. The search field lives here on every page but
 * the home page, which has the hero field — ⌘K focuses whichever one is on screen.
 *
 * The bell is presentational (AGENTS §7); the account control is Clerk.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center gap-3 px-4 sm:gap-6 sm:px-8">
        <Navbar items={items} />
        <SearchForm
          id="header-search"
          source="results"
          label="Search courses and lessons"
          placeholder="Search lessons, moments, topics…"
          className="ml-auto hidden w-full max-w-[340px] lg:block"
        />
        <HeaderActions className="ml-auto lg:ml-0" />
      </div>
    </header>
  );
}
