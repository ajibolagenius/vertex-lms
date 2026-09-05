import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; href: string; active?: boolean };

export function Navbar({
  items,
  className,
}: {
  items: NavItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Main"
      className={cn("flex flex-wrap items-center gap-8", className)}
    >
      <Link
        href="/"
        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <Logo size={24} />
      </Link>
      <ul className="flex items-center gap-6">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "text-[14px] leading-[20px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
                item.active
                  ? "text-primary-500"
                  : "text-neutral-900 hover:text-primary-500",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
