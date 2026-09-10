import type { ReactNode } from "react";
import {
  Bell,
  Bookmark,
  ChartNoAxesColumn,
  ChevronRight,
  Clock,
  CirclePlay,
  FileText,
  LayoutGrid,
  ListChecks,
  Search,
  Sparkles,
  Target,
  Timer,
  User,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonState, type ButtonVariant } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Signal — Vertex Design System",
  description: "The Vertex design language: semantic tokens, type, shape and components.",
};

function Panel({
  number,
  title,
  note,
  className,
  children,
}: {
  number?: string;
  title?: string;
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-md border border-line bg-surface p-6", className)}>
      {title && (
        <header className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-meta text-accent">{number}</span>
          <h2 className="text-meta text-ink">{title}</h2>
          {note && <p className="text-small text-ink-muted">{note}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-heading-3 text-ink">{children}</h3>;
}

/* --- 01 Colour ----------------------------------------------------------- */

const tokens: { token: string; role: string }[] = [
  { token: "canvas", role: "Page ground" },
  { token: "surface", role: "Cards, headers, fields" },
  { token: "raised", role: "Inset fill, hovered rows, chips" },
  { token: "line", role: "Default hairline" },
  { token: "line-strong", role: "Emphasised border, outline button" },
  { token: "ink", role: "Headings and body" },
  { token: "ink-muted", role: "Secondary text — AA on canvas" },
  { token: "ink-disabled", role: "Disabled and decoration only" },
  { token: "accent", role: "Actions, links, lesson results" },
  { token: "accent-hover", role: "Action hover" },
  { token: "accent-soft", role: "Accent tint" },
  { token: "moment", role: "A matched video moment" },
  { token: "moment-soft", role: "Moment tint" },
  { token: "success", role: "Completed" },
  { token: "danger", role: "Destructive, error" },
];

function Swatches({ theme }: { theme: "light" | "dark" }) {
  return (
    <div data-theme={theme} className="rounded-sm border border-line bg-canvas p-4">
      <p className="text-meta text-ink-muted">{theme}</p>
      <ul className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
        {tokens.map(({ token, role }) => (
          <li key={token} className="flex items-center gap-3">
            <span
              className="size-8 shrink-0 rounded-xs border border-line"
              style={{ background: `var(--${token})` }}
            />
            <span className="min-w-0">
              <span className="block truncate text-data text-ink">--{token}</span>
              <span className="block truncate text-small text-ink-muted">{role}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --- 02 Type ------------------------------------------------------------- */

const typeScale: { name: string; className: string; spec: string; use: string }[] = [
  { name: "Display", className: "text-display", spec: "Orbitron 600 · 28–44 / 1.14", use: "Page hero" },
  { name: "Title", className: "text-title", spec: "Inter 600 · 32 / 40", use: "Page titles" },
  { name: "Heading 1", className: "text-heading-1", spec: "Inter 600 · 24 / 32", use: "Section titles" },
  { name: "Heading 2", className: "text-heading-2", spec: "Inter 600 · 20 / 28", use: "Card titles" },
  { name: "Heading 3", className: "text-heading-3", spec: "Inter 600 · 16 / 24", use: "Sub headings" },
  { name: "Body large", className: "text-body-lg", spec: "Inter 400 · 17 / 26", use: "Lede, notes" },
  { name: "Body", className: "text-body", spec: "Inter 400 · 15 / 22", use: "Body copy" },
  { name: "Small", className: "text-small", spec: "Inter 400 · 13 / 18", use: "Captions" },
  { name: "Meta", className: "text-meta", spec: "Space Mono 700 · 12 / 16", use: "Labels, badges" },
  { name: "Data", className: "text-data", spec: "Space Mono 400 · 13 / 18", use: "Timestamps, counts" },
];

/* --- 03 Shape ------------------------------------------------------------ */

const radii = [
  { label: "2px", name: "xs", className: "rounded-xs" },
  { label: "6px", name: "sm", className: "rounded-sm" },
  { label: "10px", name: "md", className: "rounded-md" },
  { label: "16px", name: "lg", className: "rounded-lg" },
  { label: "Full", name: "full", className: "rounded-full" },
];

const spacing = [4, 8, 12, 16, 24, 32, 48, 64];

const glyphs = [
  { Icon: Search, name: "Search" },
  { Icon: CirclePlay, name: "Play" },
  { Icon: Timer, name: "Moment" },
  { Icon: FileText, name: "Transcript" },
  { Icon: Sparkles, name: "Ask" },
  { Icon: ListChecks, name: "Quiz" },
  { Icon: Bookmark, name: "Collection" },
  { Icon: ChartNoAxesColumn, name: "Level" },
  { Icon: Clock, name: "Duration" },
  { Icon: User, name: "Instructor" },
  { Icon: Bell, name: "Notifications" },
  { Icon: ChevronRight, name: "Next" },
];

const buttonVariants: ButtonVariant[] = ["primary", "secondary", "tertiary", "text"];
const buttonStates: ButtonState[] = ["default", "hover", "disabled"];

const principles = [
  {
    Icon: Target,
    title: "The second is the product",
    body: "Timestamps, durations and counts are set in mono and tabular. Data reads as data.",
  },
  {
    Icon: LayoutGrid,
    title: "Borders, not shadows",
    body: "Structure comes from hairlines. Two shadows exist, both for things that float.",
  },
  {
    Icon: Sparkles,
    title: "Two hues, no more",
    body: "Accent for actions and lessons, moment for a matched second. Everything else is ink.",
  },
  {
    Icon: LayoutGrid,
    title: "Semantic tokens only",
    body: "Never a numbered scale in a class name — it cannot mean the right thing in both themes.",
  },
];

export default function DesignSystemPage() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">
      <div className="grid gap-5">
        <Panel className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Logo size={26} />
            <h1 className="mt-6 text-display text-ink">Signal</h1>
            <p className="mt-3 max-w-xl text-body-lg text-ink-muted">
              The Vertex design language. Semantic tokens, two themes, one accent.
              Orbitron for the wordmark and the hero, Space Mono for anything a learner
              reads as data, Inter for everything else.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-meta text-ink-muted">v2.0 · Signal</p>
            <ThemeToggle />
          </div>
        </Panel>

        <Panel number="01" title="Colour" note="Same token, both themes.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Swatches theme="light" />
            <Swatches theme="dark" />
          </div>
        </Panel>

        <Panel number="02" title="Type scale">
          <ul className="divide-y divide-line">
            {typeScale.map((row) => (
              <li
                key={row.name}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-4 first:pt-0 last:pb-0"
              >
                <span className={cn("min-w-0 truncate text-ink", row.className)}>
                  {row.name === "Data" ? "12:04 · 8 lessons" : "Search your learning"}
                </span>
                <span className="flex shrink-0 gap-6">
                  <span className="text-data text-ink-muted">{row.spec}</span>
                  <span className="hidden w-32 text-small text-ink-muted sm:block">
                    {row.use}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel number="03" title="Shape">
            <GroupLabel>Radius</GroupLabel>
            <ul className="flex flex-wrap gap-4">
              {radii.map((radius) => (
                <li key={radius.name} className="w-20">
                  <div className={cn("h-14 border border-line bg-raised", radius.className)} />
                  <p className="mt-2 text-data text-ink">{radius.label}</p>
                  <p className="text-small text-ink-muted">{radius.name}</p>
                </li>
              ))}
            </ul>
            <GroupLabel>
              <span className="mt-8 block">Elevation</span>
            </GroupLabel>
            <ul className="flex flex-wrap gap-4">
              <li className="w-40">
                <div className="h-14 rounded-sm border border-line bg-surface shadow-sm" />
                <p className="mt-2 text-data text-ink">shadow-sm</p>
                <p className="text-small text-ink-muted">Popovers, menus</p>
              </li>
              <li className="w-40">
                <div className="h-14 rounded-sm border border-line bg-surface shadow-md" />
                <p className="mt-2 text-data text-ink">shadow-md</p>
                <p className="text-small text-ink-muted">Modals, drawers</p>
              </li>
            </ul>
          </Panel>

          <Panel number="04" title="Spacing" note="4px base.">
            <ul className="space-y-3">
              {spacing.map((step) => (
                <li key={step} className="flex items-center gap-4">
                  <span className="w-12 shrink-0 text-data text-ink-muted">{step}</span>
                  <span className="h-3 rounded-xs bg-accent-soft" style={{ width: step * 2 }} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel number="05" title="Buttons" note="Icons are passed in, never injected.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-y-4 text-left">
              <thead>
                <tr>
                  <th className="w-28 text-meta text-ink-muted">Variant</th>
                  {buttonStates.map((state) => (
                    <th key={state} className="text-meta text-ink-muted">
                      {state}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buttonVariants.map((variant) => (
                  <tr key={variant}>
                    <td className="text-body text-ink">{variant}</td>
                    {buttonStates.map((state) => (
                      <td key={state}>
                        <Button variant={variant} state={state}>
                          Start course
                        </Button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-line pt-6">
            <Button size="xl">
              <CirclePlay size={18} aria-hidden="true" />
              Extra large
            </Button>
            <Button size="lg">Large</Button>
            <Button size="md">Medium</Button>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel number="06" title="Fields">
            <div className="space-y-5">
              <SearchInput variant="hero" id="ds-hero" />
              <SearchInput variant="page" id="ds-page" />
              <div className="flex flex-wrap gap-4">
                <SearchInput variant="md" id="ds-md" className="min-w-[220px] flex-1" />
                <Select
                  id="ds-select"
                  label="Sort"
                  options={["Most relevant", "Newest", "Shortest"]}
                  className="w-44"
                />
              </div>
            </div>
          </Panel>

          <Panel number="07" title="Signals">
            <GroupLabel>Badges</GroupLabel>
            <div className="flex flex-wrap gap-3">
              <Badge variant="video">Video moment</Badge>
              <Badge variant="lesson">Lesson</Badge>
              <Badge variant="popular">Popular</Badge>
            </div>

            <GroupLabel>
              <span className="mt-8 block">Status</span>
            </GroupLabel>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <StatusIndicator status="now-playing" />
              <StatusIndicator status="in-progress" />
              <StatusIndicator status="completed" />
              <StatusIndicator status="locked" />
            </div>

            <GroupLabel>
              <span className="mt-8 block">Progress</span>
            </GroupLabel>
            <ProgressBar value={62} />
          </Panel>
        </div>

        <Panel number="08" title="Icons" note="Lucide, 16–24px, 1.5 stroke.">
          <ul className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {glyphs.map(({ Icon, name }) => (
              <li key={name} className="flex flex-col items-center gap-2 rounded-sm bg-raised p-4">
                <Icon size={20} aria-hidden="true" className="text-ink" />
                <span className="text-small text-ink-muted">{name}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel number="09" title="Surfaces">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-meta text-ink-muted">Surface</p>
              <p className="mt-3 text-heading-2 text-ink">Data fetching &amp; caching</p>
              <p className="mt-2 text-body text-ink-muted">
                A card sits on the canvas, bounded by a hairline.
              </p>
              <p className="mt-4 text-data text-ink-muted">8 lessons · 1h 28m</p>
            </Card>
            <Card tone="paper">
              <p className="text-meta text-ink-muted">Raised</p>
              <p className="mt-3 text-heading-2 text-ink">Inset panel</p>
              <p className="mt-2 text-body text-ink-muted">
                The quiet fill: a panel inside a card, a hovered row, a chip.
              </p>
              <p className="mt-4 text-data text-ink-muted">12:04 → 14:39</p>
            </Card>
          </div>
        </Panel>

        <Panel number="10" title="Principles">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="text-heading-3 text-ink">{title}</p>
                  <p className="mt-1 text-small text-ink-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-line pt-4 text-small text-ink-muted">
            Composite surfaces — the catalog card, the two search result cards, the header
            and the lesson tree — are built from these tokens and are best read in place on
            the pages themselves.
          </p>
        </Panel>
      </div>
    </main>
  );
}
