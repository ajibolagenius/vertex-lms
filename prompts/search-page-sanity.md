# Search page: Sanity-backed results + UI audit against the reference

## Goal

Two things, in this order:

1. **Wire the results page to Sanity content.** Add a server-side GROQ keyword search so
   `/search` returns real ranked results with no LLM in the loop. Today the page can only
   render what `/api/search` returns, and that route 502s whenever the model call fails —
   right now on `credit_balance_exhausted`, so the page shows its error state and nothing
   else.
2. **Audit the page against `design/vertex-search.png`** with real results on screen, and
   fix whatever has drifted. The reference is the source of truth (AGENTS §3).

## Skills and docs read

- `AGENTS.md` §3 (reference is truth, responsive down to mobile, reuse existing
  components), §5 (server-only data access, browser holds no token), §7 (search is the
  MCP + LLM, grounded, surfaced as cards), §11 (all ranked results, count, sort, two
  result kinds, token-based wildcard matching, `pt::text()` for Portable Text), §12
  (no `text::semanticSimilarity()`; private dataset), §13 (checks).
- `sanity-best-practices` for GROQ shape and `defineQuery`/TypeGen placement.
- The reference image itself, read at full size.

## Code inspected

- `app/search/page.tsx` — server shell: badge, "Results for …", `<Suspense>` +
  `SearchResults`, `ChartDecoration`.
- `components/search/search-results.tsx` — client. POSTs `/api/search`, derives status
  from a `query|sort|attempt` key, renders count line, `SearchForm`, count + `Select`,
  cards, skeletons, error+Retry, and the "Can't find what you're looking for?" strip.
- `components/search/result-card.tsx` — both kinds already: `VideoPanel` (16:9 poster,
  play affordance, duration chip), `KeyPointsPanel` (bullets + tick), VIDEO/LESSON badge,
  course icon + title, `Lesson 5.1 · Module title`, "Watch from 12:45" / "View lesson".
- `components/search/search-form.tsx`, `components/ui/search-input.tsx` (has a `page`
  variant: 48px, boxed ⌘K chip), `components/ui/select.tsx`.
- `app/api/search/route.ts` — MCP client, initial context, `generateText` with
  `Output.object`, `groundHits`, PostHog `search_performed`, 502 on any throw.
- `lib/search/{types,rank,ground,mcp,system-prompt}.ts` — `toResult` already turns one
  hit plus one Sanity lesson into a card and decides video-vs-lesson; `sortResults`
  already implements the sort control server-side.
- `sanity/lib/queries.ts` — `LESSONS_BY_IDS_QUERY` already projects exactly the fields a
  card needs, including the reverse-referenced course and its module→lessonIds tree.
- `sanity/lib/fetch.ts` — `sanityFetch`, `server-only`, tagged revalidation.
- `lib/format.ts` — `pluralize`, `formatTimestamp`, `lessonLabel`.
- The dataset: 118 `video` documents with `chapters`/`chunks`, 120 lessons, 10 courses.

The UI is already a close implementation of this reference — the audit is expected to
produce small corrections, not a rebuild. The reference is compared against a real render,
not against the code.

## Decisions and assumptions

- **The GROQ search is a fallback, not a replacement.** §7 fixes search as the Context MCP
  plus an LLM, so that stays the primary path. The keyword search runs when the model
  cannot: `OPENAI_API_KEY` unset, or the generate/ground step throws. A 502 becomes the
  last resort, only if the fallback also fails.
- **Same response shape, so the UI does not branch.** The fallback returns the identical
  `SearchResponse`. One new field, `source: "agent" | "keyword"`, is added to the schema
  for observability: it goes into the PostHog `search_performed` properties and makes the
  behaviour assertable from the response. Nothing renders it — the page looks the same
  either way.
- **Reuse the grounding, do not fork it.** The fallback builds the same `ModelHit` objects
  the model would have returned and feeds them through the existing `toResult` /
  `sortResults`. So card selection, the positional `5.1` label, the `?t=` deep link and the
  "no moment ⇒ Watch lesson" rule stay in exactly one place.
- **Token matching, per §11.** The query is lowercased, split on non-word characters,
  1-character tokens and a short stopword list are dropped, and each surviving token is
  wildcarded (`cach*`). Tokens are capped at 8 and 32 characters each to bound the query.
  Terms are passed as a `$terms` **parameter** — never interpolated into GROQ.
- **Search both ways and merge, per §11.** One query matches a lesson on `title`,
  `pt::text(notes)` and `keyPoints[]`, *or* on its video's `chapters[].label` /
  `chunks[].text`, so a concept taught mid-video surfaces even when the lesson text never
  names it. The `^` scoping of the nested filters is verified against the live dataset
  before it ships — the reversed form silently returns zero matches.
- **Ranking is by specificity, per §11**, computed from per-field hit counts the query
  returns: title 8, chapter label 3 (weighted above notes: a chapter is authored), key
  point 4, notes 2, transcript 1, times the number of distinct terms that hit that field.
  Ties break on the lesson title, so the order is stable between identical searches.
- **Moment resolution is two-stage, per §7**: the best-scoring matching chapter second
  first, transcript second only when no chapter matched. `momentSource` is set accordingly,
  so `toResult` keeps the second only when it came from real data.
- **Three lessons keep no timestamp**: the two videos still missing plus any lesson whose
  match is text-only. They render as lesson cards, which is the correct grounded outcome.
- **No new dependency, no new route.** The fallback is one query and one pure module.

## Files to touch

New:
- `lib/search/keyword.ts` — pure: `tokenize(query)` and `toHits(rows)` (scoring, moment
  choice, `ModelHit[]`). No `@/` imports, so the check runs under `tsx` like `rank.ts`.
- `lib/search/keyword.check.mjs` — assert self-check: tokenising (case, punctuation,
  stopwords, 1-char drop, the 8-token cap), field weighting order, chapter-before-
  transcript, `momentSource` correctness, and empty input.

Changed:
- `sanity/lib/queries.ts` — `SEARCH_LESSONS_QUERY`: the `LESSONS_BY_IDS_QUERY` projection
  plus per-field hit counts and the matched chapter/transcript moments (at most three each,
  filtered in the projection — never a whole array, §12).
- `lib/search/ground.ts` — `keywordSearch(query, sort)`: fetch, `toHits`, `toResult`,
  `sortResults`. Server-only, reusing `sanityFetch`.
- `lib/search/types.ts` — `source` on `SearchResponseSchema`.
- `app/api/search/route.ts` — run the fallback when the key is missing or the model path
  throws; tag the response and the PostHog event with `source`.
- `package.json` — `check:keyword`.
- Whatever the UI audit finds in `app/search/page.tsx`,
  `components/search/{search-results,result-card}.tsx`, or the two `ui/` primitives. Fixes
  only, no restyling beyond the reference.

Not touched: the Studio schema, the ingestion pipeline, `lib/search/mcp.ts`, the system
prompt, the Context document, any env var, `lib/video.ts`.

## Security

- The learner's query is untrusted input. It reaches GROQ only as the `$terms` parameter,
  never by string interpolation, and is bounded to 8 terms of 32 characters (the route
  already caps the raw query at 200).
- No token moves. `keywordSearch` is reached only from the route, through the `server-only`
  `sanityFetch`; the browser still holds nothing and still talks only to `/api/search`.
- Transcript text stays server-side: the projection returns at most three short matched
  chunks per video, and only `startSeconds` survives into the response — no chunk text is
  sent to the browser.
- Every displayed field still comes from Sanity, so the fallback cannot invent a course, a
  lesson, a count or a second any more than the model could.
- The error path keeps its current shape: full detail in the server log, one generic line
  to the client.

## Acceptance criteria

1. `npm run check:keyword`, `check:rank`, `check:video`, `check:ingest` all pass.
2. `POST /api/search {"query":"data fetching"}` returns `200` with `source: "keyword"`
   while `OPENAI_API_KEY` is exhausted, a non-zero `count`, a `courseCount` matching the
   distinct courses in `results`, and at least one `kind: "video"` card carrying a real
   `startSeconds`.
3. Every `startSeconds` in that response matches a real `chapters[].startSeconds` or
   `chunks[].startSeconds` of the video for that lesson, checked with a GROQ query.
4. A nonsense query (`"kubernetes operators for quantum"`) returns `200`, `count: 0`, and
   the page shows the empty strip pointing at the catalog — no invented result.
5. `?sort=newest` and `?sort=duration` reorder the same result set; `relevance` is the
   default and is ranked title-first.
6. The rendered page matches `design/vertex-search.png` at 1440 and 1024 wide: badge,
   heading with the quoted query in primary, "Found N results across M courses", the 48px
   field with the ⌘K chip, "N results" + "Most Relevant", both card kinds, the strip.
7. At 375 wide the page has no horizontal scroll (`documentElement.scrollWidth <= 375`)
   and the cards stack.
8. `npx tsc --noEmit`, `npm run lint`, `npm run build` clean; `npm run typegen` re-run for
   the new query.

## Checks to run

- `npm run check:keyword`, `npm run check:rank`, `npm run check:video`,
  `npm run check:ingest`
- `npm run typegen`, `npx tsc --noEmit`, `npm run lint`, `npm run build`
- `curl` against `/api/search` for the criteria above
- Playwright screenshots at 1440 / 1024 / 375 against the reference

## Manual test steps

1. `npm run dev`, open `/search?q=data%20fetching`. Expect ranked cards, a count line, and
   video cards reading "Watch from m:ss".
2. Click a video card → `/lessons/<slug>?t=<seconds>`; the embed starts at that second.
3. Change the sort to "Newest" and "Shortest first" — the same results reorder, and the URL
   carries `sort`.
4. Search "kubernetes operators for quantum" → empty state with "Browse all courses".
5. Reload a results URL and share it — the query and sort come back from the URL.
6. Narrow the window to 375 wide: cards stack, nothing overflows sideways.
7. With credits restored, search again and confirm the response comes back with
   `source: "agent"` and the page looks identical.

---

## Outcome (recorded after implementation)

### What differed from the plan

- **The query had to be split in two, then rejoined.** A single query carrying the card
  fields ran the reverse-referenced course subquery once per matched lesson — 91 subqueries
  on a broad search. The match step now returns only ids, ranking signals and matched
  seconds (2.1 s raw, cold), and the winners go through the existing `LESSONS_BY_IDS_QUERY`
  grounding read. `keywordSearch` is therefore two cheap reads instead of one expensive one,
  and it reuses `groundHits` wholesale.
- **Term ORing alone smeared badly.** "data fetching" returned 91 of 120 lessons, because
  `data*` matches most of the catalog. Added `coverage`: how many distinct query words a
  lesson accounts for anywhere (its text or its video), keeping only the rows that cover the
  most. Self-tuning — a one-word query keeps everything, and "data fetching" drops to 12
  results across 5 courses with the right lesson first. The query projects *which* terms hit
  each field rather than a count, so the union is exact.
- **Field hit counts became term arrays** for that reason; their lengths are still the
  ranking weights.
- **`maxRetries: 1` on the model call.** With an exhausted quota the SDK's default two
  retries meant ~15 s of dead wait before the fallback ran. One retry halves the worst case.
  A working model path is unaffected.
- **The `reason` line is the lesson's own prose.** With no model there is no generated
  sentence, so `cardDescription` takes the first paragraph of `pt::text(notes)` and cuts it
  on a word boundary — grounded, and it reads like the description the reference draws.

### UI audit against `design/vertex-search.png`

Screenshotted at 1440 / 1024 / 375 with real results, both card kinds on screen.

- **Matches the reference**: the SEARCH RESULTS badge, the display heading with the quoted
  query in primary, "Found N results across M courses", the 48px field with the boxed ⌘K
  chip, "N results" + "Most Relevant", the VIDEO and LESSON badges, the thumbnail with its
  play affordance and duration chip, the key-points panel with its tick, course icon and
  title, `Lesson 5.1 · Module`, "Watch from m:ss" / "View lesson", and the closing
  "Can't find what you're looking for?" strip.
- **Fixed**: the card description ran to three lines on a long grounded sentence and pushed
  the meta row down. Clamped to two lines (three on mobile), as the reference draws it.
- **Tried and reverted**: two-line key points. Real key points are sentences, not the
  reference's short labels, but two lines overflow the fixed 16:9 panel — worse than the
  truncation. Left at one line each, matching the reference.
- **375 wide**: cards stack, `documentElement.scrollWidth` is exactly 375 at every width.

### Verified

- `/api/search` returns `source: "keyword"` with the quota exhausted: "data fetching" → 12
  results across 5 courses, "docker" → 14 across 2, "caching and revalidation" → 1 exact.
- All nine timestamps in the "data fetching" response were checked against the dataset:
  every one is a real `chapters[].startSeconds` or `chunks[].startSeconds` of that lesson's
  video. Zero invented seconds.
- `sort=newest` and `sort=duration` reorder the same 12 results; `duration` came back
  187 s, 261 s, 315 s ascending.
- A query matching nothing (`zzzznothing`) returns `count: 0` and the empty strip.
- `check:keyword`, `check:rank`, `check:video`, `check:ingest`, `tsc --noEmit`, `lint`,
  `build` all clean.

### Needs a decision

- **Course icons are cover photos, not brand marks.** The reference draws a small Next.js /
  React / JS logo tile; the data only has a course `coverImage`, so the 24px tile is a
  cropped photo. A code change cannot fix this — it needs a logo field on `course`, or
  authored icons.
- **The chart decoration** closes the page below the strip. The reference does not draw it,
  but it is the shared site-wide footer motif. Left in place.
- **A failing model call still costs ~6-12 s** before the keyword path answers. Strictly
  better than the 502 it used to return, but a health check or a shorter timeout would cut
  it further.
- The site header wraps awkwardly at 375 (nav on two lines). Pre-existing, on every page,
  and outside this reference.
