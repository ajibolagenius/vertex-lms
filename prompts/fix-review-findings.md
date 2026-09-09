# Fix verified review findings

## Goal

Apply the verified review fixes for search initialization, MCP context loading, unsupported bookmarking UI, Node runtime declaration, self-check execution, and stale lesson-page documentation. Keep unrelated worktree changes untouched.

## Skills and docs read

- `AGENTS.md` — server/client boundaries, validation requirements, and minimal focused changes.
- `app/api/search/route.ts` — MCP client lifecycle and `finally` cleanup.
- `lib/search/mcp.ts` — initial-context cache and fetch fallback.
- `lib/search/rank.ts`, `lib/search/rank.check.mjs`, `lib/video.ts`, `lib/video.check.mjs` — self-check imports and runtime assumptions.
- `package.json`, `tsconfig.json` — current scripts and TypeScript configuration.
- `components/course-actions.tsx` and `app/lessons/[slug]/page.tsx` — bookmark control usage.
- `prompts/lesson-page.md` — stale route-flag documentation.

## Decisions

1. In the search route, assign `mcpClient = await createSearchMcpClient()` before awaiting `fetchInitialContext()`. Keep these operations sequential and retain the existing `finally` close.
2. In `fetchInitialContext`, use an `AbortController` timeout for the request and catch transport/abort failures. Log the failure server-side and return `cachedInitialContext`, matching the existing stale-cache fallback for non-2xx responses. Preserve successful response parsing and cache updates.
3. Remove `BookmarkIconButton` from the lesson header and remove its unused component export. There is no bookmark persistence endpoint or state contract, so leaving a telemetry-only control would misrepresent functionality.
4. Declare `engines.node` as `>=22.18.0` in the root `package.json`.
5. Run TypeScript self-checks through an established TypeScript-aware runner instead of plain Node importing `.ts` files. Add the required dev dependency and expose scripts for the rank and video checks. Keep `rank.ts`, `rank.check.mjs`, and the TypeScript compiler configuration behavior unchanged except where required to support the runner.
6. Update `prompts/lesson-page.md` so lesson links and rows are described as using `lesson.slug`; remove all claims that `LESSON_ROUTE_READY` gates or is flipped to true.

## Expected files

- `app/api/search/route.ts`
- `lib/search/mcp.ts`
- `components/course-actions.tsx`
- `app/lessons/[slug]/page.tsx`
- `package.json`
- `package-lock.json`
- `prompts/lesson-page.md`

## Requirements

- Do not use `Promise.all` for MCP client creation and initial context loading.
- Ensure a client created before context loading fails is closed by `finally`.
- Ensure initial-context timeout and rejected fetch both return the current stale cache.
- Do not leave a visible bookmark control that only captures PostHog telemetry.
- Keep secrets server-only and do not change search response behavior.
- Keep `rank.check.mjs` and `video.check.mjs` assertions unchanged.
- Keep the supported Node version explicit in root package metadata.

## Checks

Run:

```sh
npm install
npx tsc --noEmit
npx eslint app/api/search/route.ts lib/search/mcp.ts components/course-actions.tsx 'app/lessons/[slug]/page.tsx'
npm run check:rank
npm run check:video
```

Run `npm run build` because server route and search infrastructure changed.

## Manual test

1. Start the app and submit a search with a configured MCP endpoint.
2. Confirm a failed initial-context request does not hang and uses the stale context when available.
3. Confirm the lesson header no longer presents a non-functional bookmark action.