# Sanity content model, standalone Studio, and the web read layer

## Goal

Stand up the Vertex content model in Sanity and give the Next.js app a server-only way to
read it.

Two halves:

1. **Studio** — a standalone `studio/` workspace holding the schema for `course`,
   `module` (embedded object), `lesson`, `instructor`, and `category`, plus the small
   objects those need.
2. **Web** — a server-only Sanity client, a `sanityFetch` helper, the GROQ queries the
   catalog / course / lesson / instructor pages will read, and generated TypeGen types.

No pages, no UI. This task ends when a query run from the server returns real typed data.

## Skills and docs read

- `AGENTS.md` §5 (workspace split), §6 (stack), §7 (decisions), §8 (the data shapes),
  §12 (private dataset, server-only token), §13 (checks).
- `sanity-best-practices` → `references/schema.md`, `references/project-structure.md`,
  `references/nextjs.md`, `references/typegen.md`, `references/groq.md`.
- `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` and
  `09-revalidating.md`. Both describe the **Cache Components** model, which this repo does
  not enable (`next.config.ts` has no `cacheComponents: true`). So the previous model
  applies: caching is configured per-fetch with `next: { revalidate, tags }`. Do not turn
  Cache Components on — out of scope.

## Code inspected

- `sanity.config.ts`, `sanity.cli.ts`, `sanity/`, `app/studio/[[...tool]]/page.tsx` — an
  **embedded** Studio scaffold, all uncommitted. Contradicts AGENTS.md §5 and §12.
- `sanity/schemaTypes/index.ts` — `types: []`. Nothing to preserve.
- `sanity/lib/client.ts` — `useCdn: true`, no token. Won't read a private dataset.
- `sanity/lib/live.ts` — `defineLive` with no tokens.
- `components/cards/course-card.tsx`, `lesson-card.tsx`, `lesson-video-card.tsx`,
  `resource-card.tsx` — the props the queries eventually have to feed: `level`,
  `duration`, `modules` ("12 modules"), `moduleLabel`, `lessonLabel`, `startLabel`,
  resource `fileType`/`fileSize`.
- `app/page.tsx` — hardcoded placeholder catalog. **Left alone** in this task; wiring it to
  Sanity belongs to the catalog page task.
- `proxy.ts` — Clerk middleware, protects `/my-learning(.*)` only. Untouched.
- `design/vertex-course.png`, `design/vertex-lesson.png` — confirm which fields are stored
  vs derived (below).
- `.env.example`, `.env.local` — Clerk keys plus `NEXT_PUBLIC_SANITY_PROJECT_ID` and
  `NEXT_PUBLIC_SANITY_DATASET`. No read token yet.

## Decisions and assumptions

**D1 — Standalone Studio, web stays at the repo root.** Confirmed with the user. Delete
the embedded scaffold. AGENTS.md §5 asks for "two standalone workspaces in one repo"; the
Next app already lives at the repo root, so the root *is* the web workspace. Do not move
`app/`, `components/`, or `lib/` into a `web/` folder — that churns committed work for no
gain and the split AGENTS.md cares about (Studio not inside Next.js) is satisfied either
way.

**D2 — No `defineLive`.** The Live Content API needs a `browserToken` to read a private
dataset, which would ship the read token to the browser and break AGENTS.md §12. Delete
`sanity/lib/live.ts`. Pages are read-only and fetch server-side; a plain server client with
`next: { revalidate, tags }` covers it. Visual Editing and draft mode are out of scope.

**D3 — `import 'server-only'` at the top of the client module.** Cheapest possible
enforcement of the token rule: any accidental client import becomes a build error rather
than a leaked token. Adds one dependency (`server-only`, a Next.js first-party stub).

**D4 — Durations stored as seconds, everything else derived.** The design shows `18h 24m`,
`12 modules`, `Module 5 of 12`, `LESSON 5.1`, `35% complete`. Per AGENTS.md §8 only the
lesson's own duration is stored, as `durationSeconds` (an integer). Module duration, course
duration, module count, lesson count, and the `5.1` label are all derived — from order in
GROQ or at render time. Nothing denormalised.

**D5 — `studentCount` and `price` are display fields.** AGENTS.md §8 calls them out as
"for display". They are authored numbers, not computed from anything, and nothing reads
them as truth.

**D6 — Course cover image is the brand tile.** The dark `N` square in both designs is one
image on the course. Lessons get their own `poster`. Both use `hotspot: true`.

**D7 — Notes and instructor bio are Portable Text; key points are plain strings.**
AGENTS.md §7: content is structured, never markdown. Lesson `notes` and instructor `bio`
are `array of block`. `keyPoints` is `array of string` — a checklist line has no internal
structure, so an object wrapper would be dead weight. `proTip` stays a plain `text` field.

**D8 — `blockContent` is defined once as a shared object type.** Two fields use it
(`lesson.notes`, `instructor.bio`), so it earns its own type rather than being inlined
twice.

**D9 — Default Studio structure.** `structureTool()` with no arguments already renders the
document type list. Delete `sanity/structure.ts` rather than port it — it reimplements the
default. Add a custom structure later if authors ask for one.

**D10 — Out of scope, deliberately.** The `video` document (§8/§9), the agent `context`
document (§10), and the `progress` record (§7) are all named in AGENTS.md but not in this
task. Not stubbed, not scaffolded. They arrive with the ingestion, search, and progress
tasks respectively.

**D11 — A minimal seed import is included.** The dataset is empty, so without content the
GROQ derivations (`math::sum` across a nested reference walk, the reverse reference from
lesson to course) are unverifiable and the acceptance criteria below can't be met. Seed is
one category, one instructor, one course, three lessons, coherent per AGENTS.md §7. It is
fixture data for verification, not the real catalog. **Cut this if you'd rather author in
the Studio by hand** — say so and the query verification steps become manual.

**D12 — TypeGen output is committed.** `studio/sanity.cli.ts` gets
`typegen: { enabled: true }` writing to `../sanity.types.ts`, scanning
`../sanity/lib/**/*.ts`. That glob is the reason **all GROQ lives in
`sanity/lib/queries.ts`** — one file, one place TypeGen looks. Commit
`sanity.types.ts`; gitignore `studio/schema.json`.

**A1** — Sanity project id and dataset in `.env.local` are correct and the dataset is
private. If it turns out to be public, that's a Sanity Manage change, not a code change.

**A2** — Level values are `beginner` / `intermediate` / `advanced`. The design only shows
Beginner and Intermediate; Advanced is the obvious third. Stored lowercase, titled for the
Studio.

**A3** — Resource types are `documentation`, `guide`, and `repository`, matching the three
cards in `vertex-lesson.png`. `ResourceCard`'s `fileSize` prop has no field behind it — it
is design-only text and the card will get whatever the lesson page task decides. Not
modeled.

## Files

**Delete**

- `app/studio/` (the whole directory)
- `sanity.config.ts`, `sanity.cli.ts` (root)
- `sanity/schemaTypes/`, `sanity/structure.ts`, `sanity/env.ts`, `sanity/lib/live.ts`

**Create — studio workspace**

- `studio/package.json` — `sanity`, `@sanity/vision`, `@sanity/icons`, `styled-components`,
  `react`, `react-dom`, `typescript`. Scripts: `dev`, `build`, `deploy`, `typegen`.
- `studio/sanity.config.ts` — `defineConfig` with `projectId`, `dataset`,
  `structureTool()`, `visionTool()`, and the schema.
- `studio/sanity.cli.ts` — `defineCliConfig` with api + the `typegen` block from D12.
- `studio/tsconfig.json`, `studio/.env.example`, `studio/.gitignore`
- `studio/schemaTypes/index.ts`
- `studio/schemaTypes/documents/course.ts`
- `studio/schemaTypes/documents/lesson.ts`
- `studio/schemaTypes/documents/instructor.ts`
- `studio/schemaTypes/documents/category.ts`
- `studio/schemaTypes/objects/course-module.ts`
- `studio/schemaTypes/objects/learning-outcome.ts`
- `studio/schemaTypes/objects/lesson-resource.ts`
- `studio/schemaTypes/objects/block-content.ts`
- `studio/seed/vertex-seed.ndjson` (D11)

**Create / rewrite — web**

- `sanity/lib/client.ts` — rewritten: `import 'server-only'`, token, env read inline.
- `sanity/lib/fetch.ts` — the `sanityFetch` helper.
- `sanity/lib/queries.ts` — every GROQ query, each in `defineQuery`.
- `sanity/lib/image.ts` — kept, repointed at the inlined env (its `../env` import dies).
- `sanity.types.ts` — generated, committed.

**Edit**

- `package.json` — drop `sanity`, `@sanity/vision`, `styled-components` (they move to
  `studio/`); add `server-only`; keep `next-sanity` and `@sanity/image-url`.
- `.env.example` — add `SANITY_API_READ_TOKEN` and `NEXT_PUBLIC_SANITY_API_VERSION`.
- `.gitignore` — add `studio/schema.json`, `studio/node_modules`, `studio/dist`.

## Requirements

### Schema

Use `defineType` / `defineField` / `defineArrayMember` throughout. Give every document and
object an icon, imported from its own subpath (`@sanity/icons/Book`, not the root export —
root named exports were removed in v5 and fail at bundle time, not at type-check). Give
every document and array member a `preview`. Field names describe what the thing *is*, not
how it looks.

**`category`** (document) — `title` (required), `slug` (source: title, required),
`description` (text).

**`instructor`** (document) — `name` (required), `slug` (required), `photo` (image,
hotspot, with alt text), `expertise` (array of string), `bio` (`blockContent`).

**`lesson`** (document)

| field | type | notes |
|---|---|---|
| `title` | string | required |
| `slug` | slug | source: title, required |
| `videoUrl` | url | required; `rule.uri({scheme: ['https']})` |
| `poster` | image | hotspot, alt text |
| `durationSeconds` | number | required, positive integer (D4) |
| `freePreview` | boolean | default `false`; a label only, never access control (§7) |
| `studentCount` | number | display only (D5) |
| `notes` | `blockContent` | the Overview prose |
| `keyPoints` | array of string | "In this lesson you will:" |
| `proTip` | text | optional |
| `resources` | array of `lessonResource` | optional |

No parent-course field — derive it with a reverse reference (§8).

**`course`** (document)

| field | type | notes |
|---|---|---|
| `title` | string | required |
| `slug` | slug | source: title, required |
| `summary` | text | required |
| `coverImage` | image | hotspot, alt text (D6) |
| `level` | string | required; radio list, values per A2 |
| `price` | number | display only |
| `popular` | boolean | the POPULAR badge |
| `studentCount` | number | display only |
| `learningOutcomes` | array of `learningOutcome` | max 6 |
| `instructor` | reference → instructor | required |
| `category` | reference → category | required |
| `modules` | array of `courseModule` | required, min 1 |

**`courseModule`** (object, embedded — not a document, per §8) — `title` (required),
`summary` (text, required), `lessons` (array of `reference` → lesson, min 1). Preview shows
the title and the lesson count.

**`learningOutcome`** (object) — `icon` (string; radio or dropdown list, values matching
the four in `vertex-course.png`: layers / database / gauge / cloud), `title`, `description`.

**`lessonResource`** (object) — `resourceType` (string list per A3), `title`,
`description`, `url` (required).

**`blockContent`** (object) — `array of block`, standard styles, `strong`/`em`/`code`
decorators, link annotation. Nothing exotic.

### Web read layer

`sanity/lib/client.ts`:

```ts
import 'server-only'
```

then `createClient` from `next-sanity` with `projectId`, `dataset`, `apiVersion`,
`useCdn: true`, `token: process.env.SANITY_API_READ_TOKEN`, and
`perspective: 'published'`. Throw a clear error at module load if the project id, dataset,
or token is missing.

`sanity/lib/fetch.ts` — one exported `sanityFetch({ query, params, revalidate, tags })`
wrapping `client.fetch` with `next: { revalidate, tags }`, defaulting to a 60s revalidate.
Preserve the query string's literal type (`<const QueryString extends string>`) so TypeGen's
overload still types the result. Also export a `sanityFetchFresh` — or accept a flag — that
calls `client.withConfig({ useCdn: false })` for `generateStaticParams`, where a stale CDN
read produces missing routes.

`sanity/lib/queries.ts` — every query wrapped in `defineQuery` (imported from
`next-sanity`) with a `/* groq */` comment for highlighting. Required set:

- `COURSES_QUERY` — catalog cards. Per course: `_id`, `title`, `slug`, `summary`,
  `coverImage`, `level`, `popular`, `studentCount`, `category->{title, slug}`,
  `"moduleCount": count(modules)`,
  `"durationSeconds": math::sum(modules[].lessons[]->durationSeconds)`.
  Order `popular desc, title asc`.
- `COURSE_BY_SLUG_QUERY($slug)` — the full detail page: everything above plus
  `instructor->{name, slug, photo, expertise}`, `learningOutcomes[]{_key, ...}`, and
  `modules[]{_key, title, summary, lessons[]->{_id, title, slug, durationSeconds,
  freePreview}, "durationSeconds": math::sum(lessons[]->durationSeconds)}`.
- `LESSON_BY_SLUG_QUERY($slug)` — the lesson plus its notes, key points, pro tip,
  resources, and the parent course derived by reverse reference:
  `"course": *[_type == "course" && references(^._id)][0]{title, slug, coverImage,
  modules[]{_key, title, lessons[]->{_id, title, slug, durationSeconds}}}`.
  Returning the full module tree is intentional — the lesson page's sidebar renders it and
  derives `Module 5 of 12` / `LESSON 5.1` from position.
- `INSTRUCTOR_BY_SLUG_QUERY($slug)` — the instructor plus the courses that reference them.
- `COURSE_SLUGS_QUERY`, `LESSON_SLUGS_QUERY` — for `generateStaticParams`.

Verify the `math::sum(modules[].lessons[]->durationSeconds)` flattening in Vision before
committing it; if the nested traversal doesn't flatten as written, sum in the projection
per module and add them at the call site rather than denormalising a total onto the course.

Include `_key` in every array projection (React keys, and Visual Editing later).

Do **not** add queries for pages outside this list. Search queries, video lookups, and
progress reads belong to their own tasks.

## Security

- `SANITY_API_READ_TOKEN` is server-only — no `NEXT_PUBLIC_` prefix, listed in
  `.env.example` with a comment saying so, never imported into a client component. The
  `import 'server-only'` in `client.ts` enforces this at build time (D3).
- `sanity/lib/queries.ts` holds strings only and is safe to import anywhere; the client and
  fetch helper are the server boundary.
- Every query parameterises its slug (`$slug`). No string interpolation into GROQ.
- Read token gets **Viewer** permissions in Sanity Manage. Not Editor — nothing in this
  task writes.
- `studio/.env` is gitignored; only `studio/.env.example` is committed.
- `perspective: 'published'` so unpublished drafts can never leak to an anonymous visitor.

## Acceptance criteria

1. `app/studio/`, the root `sanity.config.ts`, and the root `sanity.cli.ts` are gone. The
   Next.js build produces no `/studio` route.
2. `cd studio && npx sanity dev` serves a Studio on `:3333` listing Courses, Lessons,
   Instructors, and Categories, each with an icon and a working preview.
3. A course authored in the Studio can reference an instructor and a category, and its
   modules can hold ordered lesson references.
4. `sanity.types.ts` exists at the repo root and exports a `*_RESULT` type for every query
   in `queries.ts`.
5. `sanityFetch(COURSES_QUERY)` from a server context returns the seeded course with a
   correct derived `moduleCount` and `durationSeconds` (the sum of its lessons' seconds).
6. `LESSON_BY_SLUG_QUERY` returns the parent course through the reverse reference — the
   lesson document itself stores no course field.
7. Importing `sanity/lib/client.ts` from a `"use client"` component fails the build.
8. `tsc --noEmit`, `eslint`, and `next build` all pass at the repo root.

## Checks to run

Web (repo root):

```
npx tsc --noEmit
npm run lint
npm run build
npm run dev          # confirm / renders and /studio 404s
```

Studio (`cd studio`):

```
npx sanity schema extract --force && npx sanity typegen generate
npx sanity dev
npx sanity schema deploy
npx sanity deploy                                    # the Studio *application*
npx sanity dataset import seed/vertex-seed.ndjson <dataset>
npx sanity cors add http://localhost:3000 --credentials
```

`sanity deploy` is what AGENTS.md §12 requires before the Context MCP will serve this
dataset — a schema-only deploy is not enough. It prompts for a studio hostname on first
run, so it needs the user.

Report the real output of each. Nothing gets marked passed without running.

## Manual test steps

1. `cd studio && npx sanity dev`, open `http://localhost:3333`.
2. Confirm four document types in the sidebar, each with an icon.
3. Open the seeded course. Confirm the instructor and category references resolve, and that
   its modules list lessons in order.
4. Create a new lesson. Confirm `videoUrl` rejects a non-https value and that
   `durationSeconds` rejects a negative number.
5. In Vision, run `COURSES_QUERY`. Confirm `moduleCount` and `durationSeconds` match the
   seeded lessons by hand.
6. In Vision, run `LESSON_BY_SLUG_QUERY` with a seeded slug. Confirm `course` resolves.
7. Back at the repo root, `npm run dev`. Confirm `http://localhost:3000/studio` 404s and the
   home page still renders unchanged.
8. Temporarily add `import { client } from "@/sanity/lib/client"` to a `"use client"`
   component and confirm `npm run build` fails with the `server-only` error. Revert.

## Out of scope

Wiring `app/page.tsx` (or any page) to these queries. The `video`, `context`, and
`progress` documents. Visual Editing, draft mode, and webhook revalidation. Any UI.

---

## Deviations from this prompt during implementation

Recorded after the fact. Each is a case where the plan above was wrong about the
installed tooling, not a change of intent.

1. **Icons import from the package root, not subpaths.** The prompt (following
   `sanity-best-practices/references/schema.md`) said to import each icon from its own
   subpath because "root named exports were removed in v5". The version `sanity@5.31.2`
   actually resolves is `@sanity/icons@3.8.0`, whose `exports` map is only `"."` and
   `"./package.json"` — subpath imports would have failed to resolve. All icons import
   from `@sanity/icons` as named exports, which is correct for this version.
2. **`sanity schema extract --force` → `sanity schema extract`.** The `--force` flag no
   longer exists in the Sanity 5 CLI (`Error: Nonexistent flag: --force`). The `typegen`
   script in `studio/package.json` drops it.
3. **`sanity/lib/env.ts` exists rather than the env being inlined into `client.ts`.**
   `image.ts` needs `projectId` and `dataset` too, and both are client-safe. Only the read
   token is server-only, and it stays in `client.ts` behind `import 'server-only'`.
4. **`tsconfig.json` now excludes `studio`.** Without it the root type check and
   `next build` compile the Studio's sources — exactly the coupling the standalone split
   exists to remove.
5. **`sanity deploy` not run.** The Studio *application* deploy publishes a permanent
   public hostname, so it was left to the user. `sanity schema deploy` did run. This is the
   one open prerequisite for the Context MCP work in the search task.
6. **CORS needed no change** — `http://localhost:3000` and `http://localhost:3333` were
   already registered on the project.
