# Video ingestion pipeline

Builds the `video` documents that give search its timestamps (AGENTS §9): one document per
unique video URL, holding the provider's chapter markers as the table of contents and the
transcript as many short timestamped chunks.

Offline tooling. It never runs in the request path, and it needs no Sanity token — the
import runs on the Sanity CLI's own auth.

## Prerequisite

`yt-dlp` on PATH:

```bash
brew install yt-dlp
```

## Run

```bash
npm run videos:ingest   # yt-dlp -> .cache/ -> videos.ndjson
npm run videos:import   # sanity dataset import --replace
```

Document ids are `video.<youtube id>`, so both steps are idempotent and re-runnable.

Flags: `--limit N` ingests the first N manifest entries (smoke run), `--refresh` refetches
even when the cache has the video.

## What it reads

- `../seed/videos.json` — the `lesson slug -> {id, …}` manifest, the run's input.
- `../seed/seed.ndjson` — only to assert each lesson's `videoUrl` still matches the
  manifest id. A drifted entry is reported and skipped rather than ingested for a video
  no lesson plays. `url` on the document must stay byte-identical to `lesson.videoUrl`:
  that equality is how a matched moment is tied back to its lesson.

## Cache

`.cache/` holds yt-dlp's `<id>.info.json` and `<id>.en.vtt` per video and is gitignored. A
cached video is not refetched, so a second run is near-instant and a failed run resumes
where it stopped.

## When a video fails

YouTube rate-limits caption downloads; a run reports each failure at the end and still
writes a valid NDJSON for everything that worked. `HTTP Error 429` just means "run it
again" — the cache keeps the successes. yt-dlp already backs off (`--retries 5`,
`--retry-sleep http:exp=3:60`, one caption track, 1.5 s between videos).

A video with chapter markers *and* captions is the good case. Captions but no chapters is
normal and fine: search falls back to matching `chunks[].text`, which §7 already specifies
as the backstop. Neither one means the video is skipped and named in the failures — a
label or a second is never invented.

## After importing

The Context MCP only sees the `video` type once the Studio application is deployed (§12):

```bash
npm run deploy
npm run context:import
```

`videos.ndjson` is committed, so the import is reproducible without network or yt-dlp.
