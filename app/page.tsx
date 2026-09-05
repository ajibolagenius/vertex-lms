import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { SiteHeader } from "@/components/nav/site-header";
import { ButtonLink } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { CourseCard } from "@/components/cards/course-card";

/* Placeholder catalog copy, taken from the reference. Sanity replaces this later. */
const courses = [
  {
    title: "Next.js for Production",
    description: "Build scalable, high-performance web applications with Next.js.",
    level: "Intermediate",
    duration: "18h 24m",
    modules: "12 modules",
    logo: "/logos/nextdotjs.svg",
    logoSize: 40,
    tile: "#0F172A",
  },
  {
    title: "Docker Essentials",
    description: "Containerize applications and streamline your development workflow.",
    level: "Beginner",
    duration: "10h 12m",
    modules: "8 modules",
    logo: "/logos/docker.svg",
    logoSize: 64,
    tile: "transparent",
  },
  {
    title: "TypeScript Deep Dive",
    description: "Go beyond the basics and write safer, more expressive code.",
    level: "Intermediate",
    duration: "14h 36m",
    modules: "10 modules",
    logo: "/logos/typescript.svg",
    logoSize: 40,
    tile: "#3178C6",
  },
];

/* Heights, as a percentage of the strip, of the decorative bar graphic. */
const bars = [40, 58, 76, 92, 68, 52, 0, 0, 46, 58, 78, 94, 50, 68, 86];

export default function Home() {
  return (
    <div className="flex-1 bg-hatch px-0 sm:px-8">
      <div className="mx-auto w-full max-w-[1440px] border-x border-line bg-paper">
        <SiteHeader />

        <main>
          <section className="px-6 py-[68px] text-center sm:px-12">
            <span className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-5 text-[12px] font-semibold tracking-[0.16em] text-primary-500 uppercase">
              Intelligent Learning
            </span>

            <h1 className="mt-9 font-display text-[clamp(2.25rem,5.9vw,3.75rem)] leading-[1.2] font-normal tracking-[-0.01em] text-black">
              Search your learning
              <br />
              in plain English.
            </h1>

            <p className="mx-auto mt-6 max-w-[470px] text-[20px] leading-[33px] text-neutral-700">
              Vertex understands what you want to learn and finds the exact
              lessons across all your courses.
            </p>

            <ButtonLink href="/courses" size="xl" className="mt-10 px-8">
              Explore Courses
              <ArrowRight size={20} aria-hidden="true" />
            </ButtonLink>

            <SearchInput
              id="home-search"
              variant="hero"
              label="Ask anything about your learning"
              placeholder="Ask anything about your learning..."
              readOnly
              className="mx-auto mt-10 max-w-[748px] text-left"
            />
          </section>

          <section className="border-t border-line px-6 pt-14 sm:px-12">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-display text-[28px] leading-[38px] text-black">
                All Courses
              </h2>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-primary-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              >
                View all courses
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.title}
                  variant="feature"
                  title={course.title}
                  description={course.description}
                  level={course.level}
                  duration={course.duration}
                  modules={course.modules}
                  mark={
                    <span
                      style={{ backgroundColor: course.tile }}
                      className="flex size-full items-center justify-center rounded-lg"
                    >
                      <Image
                        src={course.logo}
                        alt=""
                        width={course.logoSize}
                        height={course.logoSize}
                        unoptimized
                      />
                    </span>
                  }
                />
              ))}
            </div>

            <div className="flex items-center gap-4 pt-16">
              <span className="hidden h-px flex-1 bg-line sm:block" />
              <span className="flex min-w-0 items-center gap-6">
                <Star
                  size={22}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="text-primary-500"
                />
                <span className="text-[16px] leading-[24px] text-neutral-700">
                  New courses and lessons added every week.
                </span>
              </span>
              <span className="hidden h-px flex-1 bg-line sm:block" />
            </div>
          </section>

          <div
            aria-hidden="true"
            className="mt-8 h-[190px] overflow-hidden"
          >
            <div className="flex h-full items-end gap-1.5 blur-[5px]">
              {bars.map((height, i) => (
                <span
                  key={i}
                  style={{ height: `${height}%` }}
                  className="flex-1 bg-gradient-to-t from-primary-400/85 to-transparent"
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
