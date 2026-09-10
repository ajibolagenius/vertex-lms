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
    <nav aria-label="Main" className={cn("flex items-center gap-5 sm:gap-8", className)}>
      {/* Named here because the wordmark is hidden below `sm` and the mark is decorative. */}
      <Link href="/" aria-label="Vertex home">
        <Logo size={22} />
      </Link>
      <ul className="flex items-center gap-4 sm:gap-5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "block whitespace-nowrap text-[14px] leading-5 transition-colors",
                item.active ? "text-ink" : "text-ink-muted hover:text-ink",
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
