# Add Vertex to the portfolio as a side project

## Goal

Publish a `vertex` row in the portfolio's `public.projects` table (kind `side`) so it renders at
`/projects/vertex` and in `/projects?type=side`, with real screenshots of the deployed app and an
explicit credit that Vertex was built as a watch-and-build-along of a JavaScript Mastery tutorial.

## Source material (verified, not from memory)

- Tutorial video: **"Build and Deploy a Full Stack Learning Platform | Search Any Video, Jump to the
  Exact Second"** — channel **JavaScript Mastery** (`@javascriptmastery`), published 2026-08-21,
  <https://www.youtube.com/watch?v=8DfvwZ812dM>.
  Description (verbatim opening): *"Stop prompting until it works. This is how you actually engineer
  with AI. You'll build Vertex, a full-stack learning platform where you search in plain English and
  land at the exact second a topic is taught. Using agent skills, context files, and AGENTS.md, your
  AI plans first, asks for approval, and ships every feature through a pull request with a security
  review."*
- Vertex live: <https://vertex-lms-app.vercel.app> (verified 200 on `/`, `/courses`, `/search`).
- Vertex source: <https://github.com/ajibolagenius/vertex-lms> (created 2026-09-05).
- Vertex features/stack read from `README.md`, `package.json`, `app/` routes in this repo.

## Code inspected (portfolio repo)

- `src/types/project.ts` — the `Project` shape; no field exists for an external credit/reference.
- `src/lib/project-kind.ts` — `kind: "side"` → `/projects/:slug`, listed under `?type=side`.
- `src/app/projects/[slug]/page.tsx` — renders header (kind, category, year, status), description,
  `live_url` / `github_url` buttons, a Role/Duration/Year/Type table, Problem, Solution, Tech stack,
  `ProjectShowcase`, Screenshots gallery.
- `supabase/migrations/20260819000000_add_afrograph_project.sql` — the exact insert pattern to copy
  (single `insert ... on conflict (slug) do update`, `tags`/`tech_details`/`screenshots` as jsonb).
- `src/components/project-showcase.tsx` — bespoke per-slug interactive showcases. Not building one.

## Decisions and assumptions

1. **Data-only change by default.** New migration
   `supabase/migrations/<ts>_add_vertex_project.sql` mirroring the AfroGraph one, then applied to the
   remote DB. No portfolio code changes, no new columns, no showcase component.
2. **Tutorial credit lives in the copy** (option A below): first line of `solution` names the video
   title, the channel and the URL; `type` is set to `Tutorial build-along`; `role_title` is
   `Build-along learner & implementing engineer`; tags include `Tutorial Build-Along`. The URL renders
   as plain text (the detail page does not linkify body copy).
   *Option B (needs approval):* add `credit_label` + `credit_url` columns and render a clickable
   "Built along with …" line under the project header (~30 lines across migration, type, detail page,
   admin form).
3. **Screenshots from the deployed app**, not the `design/` reference images — the gallery should show
   what was actually shipped. 6 shots at 1440×900, light or default theme: home, course catalog,
   course detail, lesson page (video + notes/transcript), search results, design system page.
   Converted to `.webp` (sharp) and uploaded to the existing Supabase `project-screenshots` bucket
   with the service-role key, exactly like every existing project's screenshots.
4. `featured: true`, `status: 'live'`, `year: '2026'`, `duration: '1 week'` — consistent with the
   other recent side projects.
5. Honest framing: `problem`/`solution` describe the engineering (grounded MCP search, chapter →
   transcript timestamp resolution, server-only token boundary) while stating plainly that the build
   followed the tutorial and lists what was added beyond it (PWA, quizzes/streaks, collections,
   "Ask this lesson", transcript panel) — those are in this repo's git history past the tutorial's
   scope, and it would be misleading to present the tutorial's architecture as original design.

## Files

New:
- `supabase/migrations/<timestamp>_add_vertex_project.sql` (portfolio repo).
- 6 `.webp` objects in the Supabase `project-screenshots` bucket.

Changed (option B only): `src/types/project.ts`, `src/app/projects/[slug]/page.tsx`,
`src/app/admin/{actions.ts,project-form.tsx}`.

## Security

- Service-role key is read from the portfolio's `.env.local`, used only locally for the upload and
  the insert; never printed, never committed.
- No secrets in the migration; screenshot URLs are public bucket URLs, as with existing rows.

## Acceptance criteria

- `/projects?type=side` lists Vertex; `/projects/vertex` renders with all 6 screenshots loading.
- The tutorial's title, channel name and URL are visible on the project page.
- Live site and Source buttons point at the Vercel URL and the GitHub repo.
- Re-running the migration is idempotent (`on conflict (slug) do update`).

## Checks

- Screenshot capture script exits 0; each uploaded URL returns 200.
- Row reads back from the REST API with the expected columns.
- Portfolio: `npm run lint` and `npx tsc --noEmit` (option B only — data-only change touches no TS).
- Load `/projects/vertex` on the running portfolio dev server and confirm the gallery.

## Manual test steps

1. `cd ajibola-portfolio && npm run dev`.
2. Open <http://localhost:3000/projects?type=side> → Vertex card appears.
3. Click it → header, credit copy, Problem/Solution, Tech stack, 6 screenshots.
4. Click a screenshot → lightbox opens, arrow keys navigate.
5. Click "Live site" → vertex-lms-app.vercel.app; "Source" → the GitHub repo.
