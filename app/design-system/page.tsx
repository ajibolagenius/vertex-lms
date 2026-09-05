import type { ReactNode } from "react";
import {
  Accessibility,
  Bell,
  Bookmark,
  ChartNoAxesColumn,
  ChevronRight,
  Clock,
  CirclePlay,
  Eye,
  FileText,
  LayoutGrid,
  Search,
  Target,
  User,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { CourseCard } from "@/components/cards/course-card";
import { LessonCard } from "@/components/cards/lesson-card";
import { LessonVideoCard } from "@/components/cards/lesson-video-card";
import { ResourceCard } from "@/components/cards/resource-card";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Navbar } from "@/components/nav/navbar";
import { Pagination } from "@/components/nav/pagination";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Design System — Vertex",
  description: "The Vertex design language: tokens, type, and components.",
};

function Panel({
  number,
  title,
  className,
  children,
}: {
  number?: string;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        // min-w-0 so a panel's scrollable table cannot widen its grid track
        "min-w-0 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm",
        className,
      )}
    >
      {title && (
        <h2 className="mb-6 flex items-center gap-3">
          <span className="text-[12px] leading-[16px] font-semibold text-primary-500">
            {number}
          </span>
          <span className="text-[12px] leading-[16px] font-semibold uppercase tracking-[0.12em] text-neutral-900">
            {title}
          </span>
        </h2>
      )}
      {children}
    </section>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-[14px] leading-[20px] font-medium text-neutral-900">
      {children}
    </h3>
  );
}

const primary = [
  { name: "Primary 500", hex: "#F97316", className: "bg-primary-500" },
  { name: "Primary 400", hex: "#FB923C", className: "bg-primary-400" },
  { name: "Primary 300", hex: "#FDBA74", className: "bg-primary-300" },
  { name: "Primary 200", hex: "#FED7AA", className: "bg-primary-200" },
  { name: "Primary 100", hex: "#FFEEE5", className: "bg-primary-100" },
];

const neutral = [
  { name: "Neutral 900", hex: "#0F172A", className: "bg-neutral-900" },
  { name: "Neutral 700", hex: "#334155", className: "bg-neutral-700" },
  { name: "Neutral 500", hex: "#64748B", className: "bg-neutral-500" },
  { name: "Neutral 300", hex: "#CBD5E1", className: "bg-neutral-300" },
  { name: "Neutral 200", hex: "#E2E8F0", className: "bg-neutral-200" },
  { name: "Neutral 100", hex: "#F1F5F9", className: "bg-neutral-100" },
  { name: "Neutral 50", hex: "#FAFAFC", className: "bg-neutral-50" },
  { name: "White", hex: "#FFFFFF", className: "bg-white" },
];

const typeScale = [
  ["Display 1", "Playfair Display", "48 / 56", "Bold", "Page titles"],
  ["Display 2", "Playfair Display", "36 / 44", "Bold", "Section titles"],
  ["Heading 1", "Inter", "28 / 36", "Semi Bold", "Card titles"],
  ["Heading 2", "Inter", "22 / 30", "Semi Bold", "Sub section"],
  ["Heading 3", "Inter", "18 / 26", "Medium", "Small titles"],
  ["Body Large", "Inter", "16 / 24", "Regular", "Body copy"],
  ["Body", "Inter", "14 / 20", "Regular", "Supporting text"],
  ["Small", "Inter", "12 / 16", "Regular", "Captions, meta"],
];

const spacing = [
  { px: 4, rem: "0.25rem" },
  { px: 8, rem: "0.5rem" },
  { px: 12, rem: "0.75rem" },
  { px: 16, rem: "1rem" },
  { px: 24, rem: "1.5rem" },
  { px: 32, rem: "2rem" },
  { px: 40, rem: "2.5rem" },
  { px: 48, rem: "3rem" },
  { px: 64, rem: "4rem" },
];

const radii = [
  { label: "4px", name: "(xs)", className: "rounded-xs" },
  { label: "8px", name: "(sm)", className: "rounded-sm" },
  { label: "12px", name: "(md)", className: "rounded-md" },
  { label: "16px", name: "(lg)", className: "rounded-lg" },
  { label: "24px", name: "(xl)", className: "rounded-xl" },
  { label: "Full", name: "(circle)", className: "rounded-full" },
];

const shadows = [
  { name: "Sm", value: "0 1px 2px 0 rgba(15, 23, 42, 0.05)", className: "shadow-sm" },
  { name: "Md", value: "0 4px 12px -2px rgba(15, 23, 42, 0.08)", className: "shadow-md" },
  { name: "Lg", value: "0 12px 24px -4px rgba(15, 23, 42, 0.10)", className: "shadow-lg" },
  { name: "Xl", value: "0 20px 40px -8px rgba(15, 23, 42, 0.12)", className: "shadow-xl" },
];

const glyphs = [
  { Icon: Bell, name: "Notifications" },
  { Icon: Search, name: "Search" },
  { Icon: CirclePlay, name: "Play" },
  { Icon: FileText, name: "Notes" },
  { Icon: Bookmark, name: "Saved" },
  { Icon: ChartNoAxesColumn, name: "Level" },
  { Icon: Clock, name: "Duration" },
  { Icon: User, name: "Instructor" },
  { Icon: ChevronRight, name: "Next" },
];

const principles = [
  {
    Icon: Eye,
    title: "Clarity First",
    body: "Every element should communicate clearly.",
  },
  {
    Icon: LayoutGrid,
    title: "Consistency",
    body: "Use components and patterns consistently across the platform.",
  },
  {
    Icon: Target,
    title: "Focus & Calm",
    body: "Remove noise and help learners focus on what matters.",
  },
  {
    Icon: Accessibility,
    title: "Accessible",
    body: "Design with accessibility and inclusivity in mind.",
  },
];

export default function DesignSystemPage() {
  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6">
      <div className="grid gap-6">
        {/* Intro + 01 Colors */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="flex flex-col justify-center gap-6">
            <Logo size={32} />
            <div>
              <h1 className="text-display-1 text-neutral-900">Design System</h1>
              <p className="mt-4 max-w-sm text-body-lg text-neutral-500">
                A unified design language for Vertex learning platform. Clean,
                modern and focused on clarity, consistency and intuitive
                learning experiences.
              </p>
            </div>
            <p className="text-[12px] leading-[16px] font-medium uppercase tracking-[0.12em] text-neutral-500">
              Version 1.0 &nbsp;&middot;&nbsp; May 2025
            </p>
          </Panel>

          <Panel number="01" title="Colors" className="lg:col-span-2">
            <GroupLabel>Primary</GroupLabel>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {primary.map((swatch) => (
                <li key={swatch.name}>
                  <div className={cn("h-16 rounded-sm", swatch.className)} />
                  <p className="mt-2 text-[12px] leading-[16px] font-medium text-neutral-900">
                    {swatch.name}
                  </p>
                  <p className="text-[12px] leading-[16px] text-neutral-500">
                    {swatch.hex}
                  </p>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 mb-3 text-[14px] leading-[20px] font-medium text-neutral-900">
              Neutral
            </h3>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {neutral.map((swatch) => (
                <li key={swatch.name}>
                  <div
                    className={cn(
                      "h-16 rounded-sm border border-neutral-200",
                      swatch.className,
                    )}
                  />
                  <p className="mt-2 text-[12px] leading-[16px] font-medium text-neutral-900">
                    {swatch.name}
                  </p>
                  <p className="text-[12px] leading-[16px] text-neutral-500">
                    {swatch.hex}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* 02 Typography + 03 Type scale */}
        <div className="grid gap-6 lg:grid-cols-5">
          <Panel number="02" title="Typography" className="lg:col-span-2">
            <div className="grid gap-8">
              <div className="flex items-center gap-8">
                <span className="text-display-1 text-neutral-900">Ag</span>
                <div>
                  <p className="text-heading-3 text-neutral-900">
                    Playfair Display
                  </p>
                  <p className="mt-1 text-body text-neutral-500">
                    Elegant &middot; Readable &middot; Timeless
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <span className="text-[48px] leading-[56px] font-bold text-neutral-900">
                  Ag
                </span>
                <div>
                  <p className="text-heading-3 text-neutral-900">Inter</p>
                  <p className="mt-1 text-body text-neutral-500">
                    Clean &middot; Modern &middot; Highly legible
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel number="03" title="Type Scale" className="lg:col-span-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="text-[12px] leading-[16px] text-neutral-500">
                    <th className="pb-3 font-normal">Style</th>
                    <th className="pb-3 font-normal">Font</th>
                    <th className="pb-3 font-normal">Size / Line Height</th>
                    <th className="pb-3 font-normal">Weight</th>
                    <th className="pb-3 font-normal">Use</th>
                  </tr>
                </thead>
                <tbody>
                  {typeScale.map(([style, font, size, weight, use]) => (
                    <tr key={style} className="align-baseline">
                      <td className="py-2 pr-4 text-[14px] leading-[20px] font-semibold text-neutral-900">
                        {style}
                      </td>
                      <td className="py-2 pr-4 text-body text-neutral-700">
                        {font}
                      </td>
                      <td className="py-2 pr-4 text-body text-neutral-700">
                        {size}
                      </td>
                      <td className="py-2 pr-4 text-body text-neutral-700">
                        {weight}
                      </td>
                      <td className="py-2 text-body text-neutral-500">{use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* 04 Spacing + 05 Radius & shadows */}
        <div className="grid gap-6 lg:grid-cols-5">
          <Panel number="04" title="Spacing System" className="lg:col-span-3">
            <GroupLabel>Base unit: 4px</GroupLabel>
            <ul className="flex flex-wrap items-end justify-between gap-4">
              {spacing.map((step) => (
                <li key={step.px} className="text-center">
                  <div
                    className="rounded-xs bg-primary-200"
                    style={{ width: step.px, height: step.px }}
                  />
                  <p className="mt-3 text-[12px] leading-[16px] font-medium text-neutral-900">
                    {step.px}
                  </p>
                  <p className="text-[12px] leading-[16px] text-neutral-500">
                    ({step.rem})
                  </p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel number="05" title="Radius & Shadows" className="lg:col-span-2">
            <GroupLabel>Radius</GroupLabel>
            <ul className="flex flex-wrap gap-4">
              {radii.map((radius) => (
                <li key={radius.label} className="text-center">
                  <div
                    className={cn(
                      "size-14 border border-neutral-200 bg-white",
                      radius.className,
                    )}
                  />
                  <p className="mt-2 text-[12px] leading-[16px] font-medium text-neutral-900">
                    {radius.label}
                  </p>
                  <p className="text-[12px] leading-[16px] text-neutral-500">
                    {radius.name}
                  </p>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 mb-3 text-[14px] leading-[20px] font-medium text-neutral-900">
              Shadows
            </h3>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {shadows.map((shadow) => (
                <li
                  key={shadow.name}
                  className={cn(
                    "rounded-md bg-white p-4 border border-neutral-100",
                    shadow.className,
                  )}
                >
                  <p className="text-[14px] leading-[20px] font-medium text-neutral-900">
                    {shadow.name}
                  </p>
                  <p className="mt-2 text-[12px] leading-[16px] text-neutral-500">
                    {shadow.value}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* 06 Icons + 07 Buttons + 08 Inputs */}
        <div className="grid gap-6 lg:grid-cols-12">
          <Panel number="06" title="Icons" className="lg:col-span-3">
            <GroupLabel>Outline Style</GroupLabel>
            <ul className="flex flex-wrap items-center justify-between gap-1 text-neutral-900">
              {glyphs.map(({ Icon, name }) => (
                <li key={name}>
                  <Icon size={24} aria-label={name} />
                </li>
              ))}
            </ul>

            <h3 className="mt-6 mb-3 text-[14px] leading-[20px] font-medium text-neutral-900">
              Filled Style
            </h3>
            <ul className="flex flex-wrap items-center justify-between gap-1 text-neutral-900">
              {glyphs.map(({ Icon, name }) => (
                <li key={name}>
                  <Icon
                    size={24}
                    fill="currentColor"
                    aria-label={`${name}, filled`}
                  />
                </li>
              ))}
            </ul>

            <h3 className="mt-6 mb-3 text-[14px] leading-[20px] font-medium text-neutral-900">
              Icon Specs
            </h3>
            <ul className="list-disc pl-5 text-body text-neutral-500 marker:text-neutral-300">
              <li>24x24px grid</li>
              <li>2px stroke width (outline)</li>
              <li>Rounded line caps</li>
              <li>Consistent optical balance</li>
            </ul>
          </Panel>

          <Panel number="07" title="Buttons" className="lg:col-span-6 lg:p-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left">
                <thead>
                  <tr className="text-[12px] leading-[16px] text-neutral-500">
                    <th className="pb-3 font-normal" />
                    <th className="pb-3 font-normal">Primary</th>
                    <th className="pb-3 font-normal">Secondary</th>
                    <th className="pb-3 font-normal">Tertiary</th>
                    <th className="pb-3 font-normal">Text</th>
                  </tr>
                </thead>
                <tbody>
                  {(["default", "hover", "disabled"] as const).map((state) => (
                    <tr key={state}>
                      <th
                        scope="row"
                        className="pr-2 py-2 text-[12px] leading-[16px] font-medium text-neutral-900 capitalize"
                      >
                        {state}
                      </th>
                      <td className="pr-2 py-2">
                        <Button variant="primary" size="md" state={state}>
                          Get Started
                        </Button>
                      </td>
                      <td className="pr-2 py-2">
                        <Button variant="secondary" size="md" state={state}>
                          Explore Courses
                        </Button>
                      </td>
                      <td className="pr-2 py-2">
                        <Button variant="tertiary" size="md" state={state}>
                          View Lesson
                        </Button>
                      </td>
                      <td className="py-2">
                        <Button variant="text" size="md" state={state}>
                          Watch Video
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-6 mb-3 text-[14px] leading-[20px] font-medium text-neutral-900">
              Button Specs
            </h3>
            <ul className="list-disc pl-5 text-body text-neutral-500 marker:text-neutral-300">
              <li>Height: 44px (default)</li>
              <li>Padding: 0 16px (lg), 0 12px (md)</li>
              <li>Radius: 12px</li>
              <li>Font: Inter Medium (14&ndash;16px)</li>
            </ul>
          </Panel>

          <Panel number="08" title="Inputs" className="lg:col-span-3">
            <GroupLabel>Search / Text Input</GroupLabel>
            <SearchInput id="ds-search" label="Search anything" />

            <h3 className="mt-6 mb-3 text-[14px] leading-[20px] font-medium text-neutral-900">
              Select
            </h3>
            <Select
              id="ds-sort"
              label="Sort results"
              options={["Most Relevant", "Newest", "Shortest"]}
            />

            <h3 className="mt-6 mb-3 text-[14px] leading-[20px] font-medium text-neutral-900">
              Field Specs
            </h3>
            <ul className="list-disc pl-5 text-body text-neutral-500 marker:text-neutral-300">
              <li>Height: 44px</li>
              <li>Radius: 12px</li>
              <li>Border: 1px solid #E2E8F0</li>
              <li>Padding: 0 16px</li>
              <li>Focus: Border color #FB923C</li>
            </ul>
          </Panel>
        </div>

        {/* 09 Badges + 10 Status + 11 Progress */}
        <div className="grid gap-6 lg:grid-cols-12">
          <Panel number="09" title="Badges / Tags" className="lg:col-span-4">
            <ul className="flex flex-wrap gap-8">
              <li>
                <p className="mb-2 text-[12px] leading-[16px] text-neutral-500">
                  Video
                </p>
                <Badge variant="video">Video</Badge>
              </li>
              <li>
                <p className="mb-2 text-[12px] leading-[16px] text-neutral-500">
                  Lesson
                </p>
                <Badge variant="lesson">Lesson</Badge>
              </li>
              <li>
                <p className="mb-2 text-[12px] leading-[16px] text-neutral-500">
                  Popular
                </p>
                <Badge variant="popular">Popular</Badge>
              </li>
            </ul>
          </Panel>

          <Panel number="10" title="Status / Indicators" className="lg:col-span-5">
            <ul className="flex flex-wrap items-center gap-4">
              <li>
                <StatusIndicator status="in-progress" />
              </li>
              <li>
                <StatusIndicator status="completed" />
              </li>
              <li>
                <StatusIndicator status="now-playing" />
              </li>
              <li>
                <StatusIndicator status="locked" />
              </li>
            </ul>
          </Panel>

          <Panel number="11" title="Progress Bar" className="lg:col-span-3">
            <ProgressBar value={35} />
          </Panel>
        </div>

        {/* 12 Cards */}
        <Panel number="12" title="Cards">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-3 text-[12px] leading-[16px] text-neutral-500">
                Course Card
              </p>
              <CourseCard
                title="Next.js for Production"
                description="Build scalable, high-performance web applications with Next.js."
                level="Intermediate"
                duration="18h 24m"
                modules="12 modules"
                mark="N"
              />
            </div>
            <div>
              <p className="mb-3 text-[12px] leading-[16px] text-neutral-500">
                Lesson Card (Video)
              </p>
              <LessonVideoCard
                title="Data Fetching in Server Components"
                description="Learn how to fetch data on the server using async/await and Next.js best practices."
                lessonLabel="Lesson 5.1"
                duration="12:45"
                startLabel="Watch from 12:45"
                href="#"
              />
            </div>
            <div>
              <p className="mb-3 text-[12px] leading-[16px] text-neutral-500">
                Lesson Card (Lesson)
              </p>
              <LessonCard
                title="Data Fetching & Caching"
                description="Explore different data fetching methods in Next.js and how to cache and revalidate data for optimal performance."
                moduleLabel="Module 5"
                href="#"
              />
            </div>
            <div>
              <p className="mb-3 text-[12px] leading-[16px] text-neutral-500">
                Resource Card
              </p>
              <ResourceCard
                title="Caching and Revalidation Guide"
                description="Deep dive into Next.js caching strategies."
                fileType="PDF"
                fileSize="1.2 MB"
                href="#"
              />
            </div>
          </div>
        </Panel>

        {/* 13 Navigation */}
        <Panel number="13" title="Navigation">
          <div className="grid gap-8 lg:grid-cols-3">
            <Navbar
              items={[
                { label: "Courses", href: "#", active: true },
                { label: "My Learning", href: "#" },
              ]}
            />
            <div>
              <p className="mb-3 text-[12px] leading-[16px] text-neutral-500">
                Breadcrumbs
              </p>
              <Breadcrumbs
                items={[
                  { label: "All Courses", href: "#" },
                  { label: "Next.js for Production", href: "#" },
                  { label: "Data Fetching & Caching" },
                ]}
              />
            </div>
            <div>
              <p className="mb-3 text-[12px] leading-[16px] text-neutral-500">
                Pagination
              </p>
              <Pagination page={1} totalPages={8} hrefFor={() => "#"} />
            </div>
          </div>
        </Panel>

        {/* 14 Principles */}
        <Panel number="14" title="Principles">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <Icon
                  size={24}
                  aria-hidden="true"
                  className="shrink-0 text-neutral-700"
                />
                <div>
                  <p className="text-[14px] leading-[20px] font-semibold text-neutral-900">
                    {title}
                  </p>
                  <p className="mt-1 text-body text-neutral-500">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}
