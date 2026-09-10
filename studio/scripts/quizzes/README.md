# Quiz generation

Builds the `quiz` documents the lesson rail's Quiz tab renders: one document per lesson,
generated from that lesson's own ingested transcript.

Offline tooling, the same shape as the video pipeline. It never runs in the request path,
and it needs no Sanity token — the import runs on the Sanity CLI's own auth.

## Prerequisites

- `videos.ndjson` already built (`npm run videos:ingest`) — the transcript is the input.
- `OPENAI_API_KEY` in the environment. This step costs money; nothing else here does.

## Run

```bash
OPENAI_API_KEY=... npm run quizzes:generate   # seed + videos.ndjson -> quizzes.ndjson
npm run quizzes:import                        # sanity dataset import --replace
```

Ids are `quiz.<lesson slug>`, so both steps are idempotent. A re-run **keeps** quizzes
already in `quizzes.ndjson` and only fills the gaps; pass `--force` to regenerate
everything, which buys every question again.

Flags: `--limit N` (first N lessons), `--only <slug>` (one lesson), `--force`.

## What it checks

The model is not trusted with any of this:

- `startSeconds` must be one of the chunk seconds the script actually sent. An invented
  timestamp is dropped — the same grounding rule the search and ask paths follow.
- `answerIndex` must point at a real option, and no option may be blank: removing one
  would shift the index onto the wrong answer.
- A lesson left with no usable question is skipped rather than written half-formed.

Dropped questions are reported per lesson, so a bad run is visible rather than silent.

## Editing

The documents are generated but not read-only: an author can fix a clumsy question in the
Studio. A later `--force` run would overwrite that, so prefer `--only <slug>` when
regenerating.
