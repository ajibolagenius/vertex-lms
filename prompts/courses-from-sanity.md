# Implementation prompt: Courses from Sanity — home section + `/courses` catalog

## Goal

Two things, both driven by the same query:

1. Replace the hardcoded three-course array in `app/page.tsx` with the seeded Sanity content, so the
   home page's "All Courses" section renders real courses and each card links to its course page.
   Layout, spacing and card design stay exactly as shipped — a data swap, not a redesign.
2. Build the `/courses` catalog page, which every existing link already points at (header nav, home
   CTA, "View all courses", the course page's breadcrumb) and which currently 404s. There is no
   reference image for it, so it reuses the home page's frame, heading row and card grid, listing
   every course. Kept deliberately simple: no filters, no search, no pagination.

## Skills and docs read

- `AGENTS.md` — §5 (pages are read-only, all Sanity reads server side), §7 (never invent a course,
  duration or count), §8 (durations stored in seconds, module counts derived), §12 (private dataset,
  token stays on the server), §13 (checks).
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md` — remote images need
  `images.remotePatterns` (already added for `cdn.sanity.io` in the course-page work).

## Code inspected

- `sanity/lib/queries.ts` — `COURSES_QUERY` already projects `title`, `slug`, `summary`,
  `coverImage`, `level`, `popular`, `moduleCount`, summed `duration`, ordered `popular desc,
  title asc`. **No query changes.**
- `sanity.types.ts` — `COURSES_QUERY_RESULT` is generated and current.
- `app/page.tsx` — server component; owns a `courses` array with three courses and three
  `public/logos/*.svg` brand tiles, rendered through `CourseCard variant="feature"`.
- `components/cards/course-card.tsx` — takes `title`, `description`, `level`, `duration`,
  `modules`, `mark`, `variant`, `className`. No `href`: the cards currently link nowhere.
- `app/design-system/page.tsx:542` — renders `CourseCard` with `mark="N"` and no `href`, so any
  change to the component must stay additive and optional.
- `lib/format.ts` — `formatDuration`, `formatLevel`, `pluralize`, added with the course page.
- `sanity/lib/fetch.ts` / `image.ts` — `sanityFetch`, `urlFor`.

## Decisions and assumptions

1. **The home section shows the first three courses** from `COURSES_QUERY`, which is already
   ordered popular first then alphabetically — the same shape the hardcoded array had. `/courses`
   shows all of them from the same query.
1b. **The catalog has no design reference**, so per §3 it borrows the home page's own vocabulary:
   the hatch frame, `SiteHeader`, a Playfair "All Courses" heading with the course count beside it,
   and the same three-up `CourseCard` grid, closing with `ChartDecoration`. Nothing new is invented.
2. **The brand-logo tile becomes the course's cover image**, cropped square into the existing 72px
   tile. Seeded covers are picsum photographs, so the tiles will look like photos, not the mock's
   brand marks. The three `public/logos/*.svg` files are deleted with the array that used them.
3. **The card grid is extracted to `components/cards/course-grid.tsx`** because two pages now
   render it; the markup moves verbatim, so the home page does not change visually.
4. **`CourseCard` gains an optional `href`.** When set, the card is wrapped in a `next/link` with
   the project's focus-visible ring; when absent it renders exactly as today, so the design-system
   sheet is untouched.
5. **Every displayed value is derived**: level via `formatLevel`, total duration via
   `formatDuration`, module count via `pluralize(moduleCount, "module")`. Nothing hardcoded.
6. **Degradation**: a course with no cover image falls back to the existing initial-letter mark; a
   course with no summary renders an empty description; the section is omitted if the query returns
   nothing.
7. No new dependencies, no new components, no visual change beyond the content itself.

## Files to touch

```
app/page.tsx                       fetch COURSES_QUERY, drop the hardcoded array and logo tiles
app/courses/page.tsx               new: the catalog route
components/cards/course-grid.tsx   new: the shared card grid (markup moved from app/page.tsx)
components/cards/course-card.tsx   + optional href (additive)
public/logos/*.svg                 deleted — nothing references them once the array is gone
```

No changes to `sanity/lib/queries.ts`, the Studio schema, the seed, or `sanity.types.ts`.

## Requirements

- The read goes through `sanityFetch` in the existing server component; no client component, no
  token or client anywhere near the browser.
- Cover images render with `next/image` + `urlFor(...).width(144).height(144).fit('crop')` and the
  stored `alt`.
- Cards link to `/courses/<slug>`; a course without a slug is skipped.
- Keep the current grid, card variant, meta row and section chrome untouched.
- `/design-system` renders exactly as it does today.
- `/courses` is a server component reading the same query, public (it is not in `proxy.ts`'s
  protected matcher), with `generateMetadata`-level `metadata` for title and description, and an
  empty state if the query returns nothing.

## Security considerations

The Sanity client stays `server-only`; the page is already a server component. Only the public
`NEXT_PUBLIC_SANITY_*` values reach the browser through `urlFor`'s CDN URLs. Nothing writes, no user
input is read, and the route stays public per §7.

## Acceptance criteria

1. `/` lists three real seeded courses, popular first, with their real level, total duration and
   module count.
2. `/courses` lists all ten seeded courses in the same grid, with the count in the heading row.
3. Each card on both pages navigates to its `/courses/<slug>` page.
4. The course page's "All Courses" breadcrumb and the header's "Courses" link both resolve.
5. No hardcoded course copy or logo files remain in the repo.
6. `/design-system` is visually unchanged.
7. `npx tsc --noEmit`, `npm run lint` and `npm run build` all pass.

## Checks to run

```
npx tsc --noEmit
npm run lint
npm run build
npm run dev   # open / and /design-system
```

## Manual test steps

1. `npm run dev`, open `http://localhost:3000/`.
2. Confirm the three cards show seeded courses with cover-image tiles and derived meta.
3. Click each card and land on the matching course page.
4. Click "View all courses" → `/courses` lists all ten; click one → its course page.
5. From a course page, click the "All Courses" breadcrumb → the catalog.
6. Open `/design-system` → section 12 (Cards) unchanged.
7. Resize to 375px on both pages: the grid collapses to one column, no horizontal scroll.
