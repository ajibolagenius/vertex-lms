# Seed Sanity from the provided seed.ndjson

## Goal

Load the supplied content into the `8mavyltu` / `production` dataset with the Sanity CLI
importer, verify the document counts, and align the Studio schema (and the two GROQ
queries that name the drifted fields) with the field names the seed actually uses.

The seed files are the source of truth and are **not modified**.

## Files provided (read only)

- `studio/scripts/seed/seed.ndjson` — 141 documents, 392 KB.
- `studio/scripts/seed/videos.json` — a lookup map, `lesson slug -> {id, title, channel, duration, query}`.

Delivered as `studio/scripts / seed/` (stray spaces in both directory names). Renamed to
`studio/scripts/seed/` at the user's request after the import — the directories moved, the
two files themselves are byte-for-byte untouched.

## Code and data inspected

- `studio/schemaTypes/**` — `course`, `lesson`, `instructor`, `category`, plus
  `courseModule`, `learningOutcome`, `lessonResource`, `blockContent`.
- `sanity/lib/queries.ts` — the only web file naming any of the drifted fields.
- `sanity/lib/{client,fetch,env,image}.ts`, `sanity.types.ts`.
- The dataset itself: `*[!(_id in path("drafts.**"))]` returns 13 documents, **all
  `system.*`**. No content to preserve, no id collisions.
- `sanity.cli.ts` — TypeGen reads `../sanity/lib/**/*.ts` against `schema.json`.
- CLI is authenticated (`sanity debug`), CLI v6.7.2, Studio on Sanity 5.31.

## Seed shape (extracted, not assumed)

| type | count |
|---|---|
| `course` | 10 |
| `lesson` | 120 |
| `instructor` | 5 |
| `category` | 6 |
| **total documents** | **141** |

Embedded objects: `module` (40, inside `course.modules`), `learningOutcome` (40),
`resource` (122, inside `lesson.resources`).

Ids are human-readable and stable (`course.nextjs-app-router-in-depth`,
`lesson.<slug>`, `instructor.mira-kovac`, `category.web-development`), so the import is
idempotent and re-runnable.

Images arrive as `_sanityAsset: "image@<url>"` on `course.coverImage`, `lesson.thumbnail`,
and `instructor.photo` — 135 of them. The CLI importer uploads each URL and rewrites it
into a real asset reference. This is the slow part of the import and needs network.

Portable Text in `lesson.notes` and `instructor.bio` uses only `normal` / `h2` styles and
`bullet` lists, no marks and no annotations — all already allowed by `blockContent`.

## Drift between the seed and the current schema

The importer does not validate against the schema, so the import succeeds either way — but
the Studio would show "unknown field" on every lesson and every module, and
`LESSON_BY_SLUG_QUERY` would return `null` for three fields. The seed cannot change, so the
schema moves:

| seed | current schema | action |
|---|---|---|
| `lesson.thumbnail` | `lesson.poster` | rename field to `thumbnail` |
| `lesson.duration` | `lesson.durationSeconds` | rename field to `duration` |
| resource `_type: "resource"`, field `type` | `lessonResource`, field `resourceType` | rename type to `resource`, field to `type` |
| module `_type: "module"` | `courseModule` | rename type to `module` |
| `level`: beginner / intermediate / advanced | same list | no change |
| outcome `icon`: layers, workflow, gauge, rocket, sparkles, shield, puzzle, code | layers, database, gauge, cloud | replace list with the 8 in use |
| resource `type`: `link` (all 122) | documentation / guide / repository | replace list with `link` |

## Decisions and assumptions

- **The seed wins.** Every rename above moves the schema, never the data. The instruction
  is explicit that the files are not to be touched.
- **`videos.json` is a manifest, not import input.** It has no `_type` / `_id` and every
  lesson in the seed already carries the matching `videoUrl`
  (`https://www.youtube.com/watch?v=<id>`). So it is used as a **verification source**:
  assert each of its 120 keys maps to a lesson whose `videoUrl` ends in that video id.
  It is the input for the section 9 ingestion pipeline later, which is out of scope here.
- **No `video` document type is created.** Section 9 ingestion is a separate task; the seed
  contains no video documents.
- `--replace` is passed so re-running the import is safe. The dataset has no content, so
  nothing is destroyed on the first run.
- `studio/seed/vertex-seed.ndjson` is deleted in the working tree (the file these new ones
  replace). Left deleted; committed with this change.
- TypeGen is re-run so `sanity.types.ts` reflects the renamed fields.

## Files to touch

- `studio/schemaTypes/documents/lesson.ts` — `poster` → `thumbnail`, `durationSeconds` →
  `duration`, `lessonResource` → `resource` in the resources array, preview `select`.
- `studio/schemaTypes/objects/lesson-resource.ts` — type name `resource`, field `type`,
  option list `link`.
- `studio/schemaTypes/objects/course-module.ts` — type name `module`.
- `studio/schemaTypes/objects/learning-outcome.ts` — the 8 icon values in use.
- `studio/schemaTypes/documents/course.ts` — `modules` array member `module`.
- `studio/schemaTypes/index.ts` — the two renamed exports.
- `sanity/lib/queries.ts` — `poster` → `thumbnail`, `durationSeconds` → `duration` (3
  sites), `resourceType` → `type`.
- Regenerated: `studio/schema.json`, `sanity.types.ts`.

Not touched: the seed files, `sanity/lib/client.ts`, `fetch.ts`, any component, any route.

## Security

- The import runs on the CLI's own auth token. No token is written to a file, and no token
  is added to the repo or to any client bundle.
- The dataset stays private. Nothing here changes dataset visibility or the web read token.
- The 135 image URLs (`i.ytimg.com`, `picsum.photos`) are fetched by the importer at import
  time and become Sanity-hosted assets; no external URL survives into the content.

## Acceptance criteria

1. `sanity dataset import` completes without error against `production`.
2. Post-import counts, queried from the dataset: `course` 10, `lesson` 120,
   `instructor` 5, `category` 6 — 141 content documents.
3. Zero unresolved references: `count(*[_type=="course"].modules[].lessons[]->_id)` and
   the instructor / category references all resolve (no dangling `_ref`).
4. `count(*[_type in ["course","lesson","instructor"] && !defined(coverImage.asset) && !defined(thumbnail.asset) && !defined(photo.asset)])` is 0 — every image asset uploaded.
5. All 120 `videos.json` keys match a lesson whose `videoUrl` carries that video id.
6. Studio schema shows no unknown fields for the imported documents (verified by the
   renames above, spot-checked in `sanity dev`).
7. `npx sanity schema extract && npx sanity typegen generate` succeeds; `sanity.types.ts`
   has `thumbnail` / `duration` / `type` on the right types.
8. Web `tsc --noEmit` and `eslint` pass.

## Checks to run

In `studio/`:
- `npx sanity dataset import "scripts/seed/seed.ndjson" production --replace`
- `npx sanity documents query` for the counts and the reference / asset assertions
- `npm run typegen`

In the repo root:
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (schema renames reach `sanity.types.ts`, which server code imports)

Not run: `sanity deploy`. Studio deploy is required before the Context MCP will serve the
dataset (AGENTS §12), but that belongs to the search task, not this one.

## Manual test steps

1. `cd studio && npm run dev`, open the Studio, and open a course — e.g. *Next.js App
   Router in Depth*. Cover image renders, instructor and category resolve to real titles,
   4 modules each list their lessons by title.
2. Open a lesson from that module. Thumbnail renders, `duration` shows, notes render as
   rich text with an h2 and a bullet list, `keyPoints` / `proTip` / `resources` are
   populated, and **no field shows an "unknown field" warning**.
3. Open an instructor — photo, expertise chips, and a rich-text bio.
4. Confirm the counts printed by the verification queries match the table in Acceptance.
