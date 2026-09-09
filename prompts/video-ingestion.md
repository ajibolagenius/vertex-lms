# Offline video ingestion pipeline (AGENTS §9)

## Goal

Build the `video` documents that give search its timestamps: one document per unique video
URL, holding YouTube's chapter markers as the table of contents and the transcript split
into short timestamped chunks. Offline tooling only — it never runs in the request path.

After this, a search hit that matches a chapter label or a transcript chunk carries a real
`startSeconds`, and the lesson page's existing `?t=` → `&start=` embed plays from that
second. No UI work, no new route.

## Skills and docs read

- `AGENTS.md` §5 (boundaries), §7 (two-stage timestamps, grounding), §8 (the `video` shape),
  §9 (ingestion), §10 (Context document), §12 (whole transcripts overflow the context
  window; private dataset; MCP needs a deployed Studio), §13 (checks).
- `studio/scripts/context/README.md` — why the Context document is imported, not authored.
- `prompts/seed-import.md` — the seed is read-only; `videos.json` is named there as the
  input for this task.
- `sanity-best-practices` is not needed for a document type this plain; the existing
  `studio/schemaTypes/documents/lesson.ts` is the pattern to match.

## Code and data inspected

- `studio/schemaTypes/**` — no `video` type exists yet. `lesson.videoUrl` is a required
  https url; `lesson.duration` is seconds.
- `studio/scripts/seed/videos.json` — 120 entries, `lesson slug -> {id, title, channel,
  duration, query}`. **120 unique video ids**, all matching `[A-Za-z0-9_-]+`.
- `studio/scripts/seed/seed.ndjson` — every lesson's `videoUrl` is exactly
  `https://www.youtube.com/watch?v=<id>` for the manifest's id (verified for
  `lesson.nextjs-app-router-in-depth-file-system-routing` → `9602Yzvd7ik`).
- `lib/search/system-prompt.ts` and `studio/scripts/context/vertex-search.ndjson` — both
  already instruct chapters-first-then-chunks, tie a moment back to the lesson whose
  `videoUrl` equals the video's `url`, and forbid projecting a whole array. The Context
  document also says *"the `video` type currently holds ZERO documents"*, which this change
  makes false.
- `lib/search/rank.ts` / `types.ts` — `startSeconds` already survives grounding when the
  model attributes it to a real chapter/chunk; both carry a stale "no video documents exist
  yet" comment, and `rank.ts` carries a `ponytail:` note saying a real moment should decide
  `kind` once they do.
- `lib/video.ts` — YouTube-only, `youtubeEmbedUrl(id, startSeconds)`; playback from a second
  already works, so YouTube is the one provider where both halves of §9 exist.
- Environment: `yt-dlp 2026.07.04` and `ffmpeg` on PATH, node v26.7.0. Probed
  `9602Yzvd7ik`: 7 real chapters with clean labels, English auto-captions available
  (`en` + `en-orig`), no cookies needed.

## Decisions and assumptions

- **`yt-dlp` is the captions/chapters source.** It gives both in one call
  (`--write-info-json` → `chapters[]`, `--write-auto-subs` → VTT) with no new npm
  dependency and no API key. It is a documented prerequisite of the script, not a runtime
  dependency of the app.
- **YouTube only.** §9 forbids treating a provider as supported until ingestion *and*
  playback exist; `lib/video.ts` plays YouTube alone. Non-YouTube URLs are skipped and
  reported, not half-ingested.
- **NDJSON + `sanity dataset import`**, matching `seed/` and `context/`. The pipeline needs
  no write token (CLI auth), so no token enters the repo and §5's "writes go through the
  server" is untouched. Generated `videos.ndjson` is committed (est. ~1 MB, alongside the
  392 KB seed) so the import is reproducible without network or yt-dlp.
- **Ids:** `_id = video.<id>`, field `id = <youtube id>`, `url =
  https://www.youtube.com/watch?v=<id>` — byte-identical to the lesson's `videoUrl` so the
  model's join works. `_id` is sanitised to `[A-Za-z0-9._-]` (a no-op for YouTube ids, kept
  as the §9 guard). Stable ids ⇒ the import is idempotent and re-runnable with `--replace`.
- **Chunking:** flush a chunk when it reaches ~30 s or ~300 characters, whichever comes
  first, timestamped at its first cue. Measured on the probe: 299 cues → 19 chunks, ~5 KB
  of text for a 6-minute video. Short enough that a filtered projection of three matches
  costs the model almost nothing.
- **Auto-caption dedupe:** YouTube's rolling captions repeat the previous line and carry
  inline `<00:00:00.440><c>word</c>` timings. Strip tags, then emit a line only when it
  differs from the last emitted line. Cue start is the timestamp; word-level timings are
  ignored.
- **Caption preference:** manual `en` > auto `en` > `en-orig` > any other `en-*`.
- **No chapters is not a failure.** A video with no chapter markers gets `chapters: []` and
  relies on the transcript backstop that §7 already specifies. Chapters are never invented,
  and none are authored by hand in this pass.
- **Cache and resume.** Per-video yt-dlp output lands in a gitignored
  `studio/scripts/videos/.cache/`; a cached video is not refetched. 120 sequential fetches
  with a short delay between them, so a rate-limited or failed video can be retried without
  starting over. Failures are collected and printed at the end; a partial run still writes
  a valid NDJSON for what succeeded.
- **The manifest drives the run**, not a dataset query — the pipeline stays offline and
  needs no read token.

## Files to touch

New:
- `studio/schemaTypes/documents/video.ts` — the document type. `id` (string), `url` (url),
  `chapters[]` of inline `{startSeconds, label}`, `chunks[]` of inline `{startSeconds,
  text}`. Chapter/chunk objects are inline array members, not shared object files: nothing
  else uses them. Fields are described as machine-written by the pipeline.
- `studio/scripts/videos/parse.mjs` — the pure half: `videoDocId`, `watchUrl`,
  `parseChapters(infoJson)`, `parseVtt(text)`, `chunk(lines)`. No I/O, no deps.
- `studio/scripts/videos/parse.check.mjs` — one runnable `assert` self-check over the
  parsing and chunking: tag stripping, rolling-caption dedupe, the 30 s and 300-char flush
  boundaries, chapter mapping, id sanitising, and empty input.
- `studio/scripts/videos/ingest.mjs` — the I/O half: read the manifest, dedupe by id, shell
  out to `yt-dlp` (cached), parse, write `videos.ndjson`, print a summary.
- `studio/scripts/videos/README.md` — prerequisites, the two commands, what is cached,
  what to do when a video fails.
- `studio/scripts/videos/videos.ndjson` — generated, committed.

Changed:
- `studio/schemaTypes/index.ts` — register `video`.
- `studio/package.json` — `videos:ingest`, `videos:import`.
- `package.json` — `check:ingest` (plain node, next to the existing `check:*`).
- `.gitignore` — `studio/scripts/videos/.cache/`.
- `studio/scripts/context/vertex-search.ndjson` — drop the "ZERO documents" instruction and
  replace it with the two-stage resolution rule now that the documents exist.
- `lib/search/rank.ts` — resolve the `ponytail:` note: a real chapter/transcript moment on a
  playable video now decides a `video` card, instead of it being the model's `kind` alone.
  Stale "no video documents exist yet" comment removed.
- `lib/search/types.ts` — same stale comment.
- Regenerated: `studio/schema.json` (gitignored), `sanity.types.ts`.

Not touched: the seed files, `lib/video.ts`, the lesson page, the search route, any
component, any env var.

## Security

- No new credential. The pipeline runs on the Sanity CLI's own auth; no read token, write
  token or API key is read, written or committed.
- Nothing reaches the browser: `video` documents are an internal lookup, and the search
  route already returns only grounded card fields. No transcript text is ever sent to the
  client.
- The request path is untouched — no route, server module or client component gains a
  dependency on `yt-dlp` or on the cache.
- Transcript text is stored as plain strings and only ever rendered as a filtered projection
  to the model; nothing from a caption file is interpolated into GROQ or into HTML.
- The dataset stays private; dataset visibility is unchanged.

## Acceptance criteria

1. `npm run check:ingest` passes.
2. `npm run videos:ingest` (in `studio/`) writes `videos.ndjson` with one document per
   unique manifest video, each `_type: "video"`, and reports 0 failures — or names exactly
   which videos failed and why.
3. Every document's `url` equals the `videoUrl` of the lesson that uses it, verified by a
   GROQ count of zero mismatches after import.
4. No document holds the transcript in a single field; every `chunks[].text` is under ~400
   characters and `chunks[].startSeconds` is non-decreasing.
5. `npm run videos:import` completes, and `count(*[_type == "video"])` is 120.
6. `npm run deploy` (Studio) and `sanity schema deploy` succeed, so the MCP serves the
   `video` type.
7. `npm run context:import` completes with the corrected instructions.
8. Web: `npx tsc --noEmit` and `npm run lint` clean; `npm run build` clean (server modules
   changed).
9. A live search for a topic taught mid-video returns at least one card with a real
   `startSeconds`, and opening it plays the embed from that second.

## Checks to run

- `npm run check:ingest` (root)
- `npm run videos:ingest`, `npm run videos:import`, `npm run deploy`,
  `npm run context:import` (studio)
- `npx tsc --noEmit`, `npm run lint`, `npm run build` (root)
- `npm run typegen` (root, delegates to studio)
- One live search request against the MCP endpoint (§13 requires it for search/ingestion
  work)

## Manual test steps

1. `npm run check:ingest` — self-check passes.
2. `cd studio && npm run videos:ingest` — watch the per-video log; re-run it and confirm the
   second run is near-instant (cache hit) and produces a byte-identical NDJSON.
3. `npm run videos:import`, then in Vision:
   `count(*[_type == "video"])` → 120,
   `count(*[_type == "lesson" && !defined(*[_type=="video" && url == ^.videoUrl][0]))` → 0.
4. `npm run deploy && npm run context:import`.
5. `cd .. && npm run dev`, restart-fresh so the cached initial context reloads.
6. Search for a mid-video concept, e.g. "deleting the app folder" or "handling non-existing
   routes". Expect at least one video card reading "Watch from m:ss".
7. Click it: `/lessons/<slug>?t=<seconds>` opens and the YouTube embed starts at that
   second, on the Vertex page.
8. Search for something absent, e.g. "kubernetes operators" — empty state, no invented
   timestamp.

---

## Outcome (recorded after implementation)

### What differed from the plan

- **Sanity rejects an id element starting with `-`.** Roughly one YouTube id in 60 does
  (`-QVoIxEpFkM`), and the import fails outright: `Invalid document ID
  "video.-QVoIxEpFkM"`. `videoDocId` now prefixes a `v` in that case. Every YouTube id is
  11 characters, so a prefixed id cannot collide with a real one, and `id` stays the
  authoritative field. This is exactly the §9 "strip whatever the datastore rejects"
  clause, and it is now a case in the self-check.
- **Some videos publish only a regional caption track** (`en-US`, `en-GB`, `en-orig`),
  which `--sub-langs en` does not match. The fetch is now two passes: the narrow `en`
  first — every extra track is another request towards a 429 — then `en.*` only if nothing
  landed. The second pass is best-effort: a 429 there still leaves the info-json, so the
  chapters survive.
- **YouTube rate-limits caption downloads.** With `--sleep-subtitles 1`, `--retries 5`,
  `--retry-sleep http:exp=3:60` and 1.5 s between videos, a full run still collects a
  handful of 429s. The cache makes that a non-event: re-running the ingest picks up only
  the stragglers. It took five runs to get from 112 to 118.
- **Playback verification stayed at the unit level.** The embed URL is built in a client
  component from `useSearchParams`, so `start=` is not in the server-rendered HTML;
  `lib/video.check.mjs` covers `?t=` → `&start=`, and that path was not changed here.

### Results

- **118 of 120 videos ingested.** 79 carry chapter markers, 39 are transcript-only, 4546
  transcript chunks in total, none over 400 characters (longest 298). `videos.ndjson` is
  1.5 MB.
- **2 lessons have no video document**: `system-design-foundations-message-queues` and
  `devops-with-docker-and-kubernetes-helm` — both are unresolved caption 429s, not a code
  problem. Re-running `npm run videos:ingest` then `npm run videos:import` adds them. Until
  then those lessons return as lesson cards with no timestamp, which is the correct grounded
  behaviour.
- Verified in the dataset: `count(*[_type=="video"])` 118, videos whose `url` matches no
  lesson `videoUrl` 0, videos with an empty `chunks` array 0, chunks over 400 characters 0,
  lessons with no video 2.
- The two-stage moment query was written against the live dataset before it went into the
  instructions. The nested-filter scoping is the trap worth recording: inside
  `$terms[...]`, `@` is the term and `^` is the chapter, so it reads `^.label match @` —
  the reversed form `@.label match ^.^` silently returns zero matches on a document that
  the outer filter just matched.
- The Context MCP `initial-context` endpoint returns the `video` type, its `chapters` and
  `chunks`, and the new instructions — so the deployed-Studio gate of §12 is satisfied.

### Blocked

- **The live end-to-end search could not run: the OpenAI account has no credits**
  (`insufficient_quota` / `credit_balance_exhausted`, `/api/search` → 502). Everything up
  to the model call is verified — MCP reachable, video type served, moment queries correct
  against real data, grounding and card selection unit-checked. Acceptance criterion 9
  needs one search once credits are topped up.
