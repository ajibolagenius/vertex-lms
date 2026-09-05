# Implementation prompt: Clerk authentication

## Goal

Wire Clerk into the Vertex web app: install the SDK via the Clerk CLI, mount `ClerkProvider`,
add a Next.js 16 `proxy.ts` that gates only the private surfaces, and replace the placeholder
avatar in the site header with real signed-in / signed-out controls. Nothing else — no progress
writes, no Sanity, no PostHog, no per-user data. Auth only.

## Skills and docs read

- `AGENTS.md` — §5 (auth is Clerk, wired through Next.js middleware; secret key server-only,
  publishable key is the only value that reaches the browser), §7 (browsing public, gate only what
  a feature marks protected; notification bell stays presentational), §12 (secret key server-only,
  protect private routes in middleware not client code; `.env.example` is the canonical list),
  §13 (checks).
- `clerk-nextjs-patterns` skill + `references/middleware-strategies.md` — public-first matcher
  pattern, `await auth()` on the server, `<Show when="signed-in">` for client-side conditionals.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md` —
  `middleware.js` is **deprecated in Next.js 16 and renamed to `proxy.js`**.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` — `proxy.ts`
  sits at the project root beside `app/`, exports the function as default or named `proxy`, plus an
  optional `config.matcher`.
- The `/clerk` setup command supplied by the user (CLI flow, `--app app_3IuipoRIo1ieAmWJq9IaxjYDDz5`,
  `'/__clerk/:path*'` matcher entry, `clerk doctor`).

## Code inspected

- `package.json` — Next `16.3.4`, React `19.2.8`, npm (`package-lock.json`). No Clerk dependency yet.
- `app/layout.tsx` — `html` carries the font variables and `h-full`; `body` is
  `min-h-full flex flex-col`. `ClerkProvider` goes **inside** `<body>`, wrapping `{children}`.
- `components/nav/site-header.tsx` — 97px header row, a presentational bell button and a 50px
  `AA` initials circle (`bg-primary-100 text-primary-500 border border-line`) explicitly commented
  "Clerk supplies the real user later". This is the only file that changes visually.
- `components/ui/button.tsx` — `Button` / `ButtonLink`, variants `primary | secondary | tertiary |
  text`, sizes `xl | lg | md`. Signed-out controls reuse these rather than new styles.
- `app/globals.css` — tokens (`primary-500`, `line`, `paper`, radii) the Clerk appearance overrides
  will point at.
- `.gitignore` — currently ignores `.env*` wholesale, so `.env.example` would be ignored.
- No `components.json` → the shadcn/`@clerk/ui` theme step of the setup command does not apply.
- `clerk` CLI is **not** installed (`command -v clerk` → exit 1). Node 26.7.0, npm 11.19.0.
- `app/` has only `page.tsx` and `design-system/page.tsx`; `/my-learning` and `/courses` are linked
  from the header but not built yet.

## Decisions and assumptions

1. **Package manager: npm**, from `package-lock.json`. CLI installed globally with
   `npm install -g clerk`.
2. **`proxy.ts`, not `middleware.ts`.** Next 16 deprecated the old name. If `clerk init` writes
   `middleware.ts`, rename it to `proxy.ts` at the repo root.
3. **Public-first gating** (AGENTS §7: browsing is public). Protected matcher today is
   `/my-learning(.*)` only — the one surface the header links to that is per-learner. `/api/progress`
   gets added to the matcher when that route is actually built, not now.
4. **Signed-in header = the reference design.** `design/vertex-home.png` shows an initials circle,
   so signed-in renders `<UserButton>` sized to the same 50px circle via `appearance`. There is no
   design reference for a signed-out header, so signed-out reuses existing `Button` styles:
   "Sign in" (`secondary`, `md`) + "Sign up" (`primary`, `md`), same 50px row height.
5. ~~**Modal auth, no `/sign-in` route.**~~ **Revised during implementation:** `clerk init`
   scaffolded `app/sign-in/[[...sign-in]]` and `app/sign-up/[[...sign-up]]` and wrote the matching
   `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` env vars. Kept them — `auth.protect()` needs a
   real sign-in URL to redirect a gated request to, which a modal cannot provide. `SignInButton` /
   `SignUpButton` navigate to those routes.
6. **The bell stays presentational** (AGENTS §7). Clerk does not touch it.
7. **`.env.example` is committed** as the canonical key list; `.gitignore` gains `!.env.example`.
   `.env.local` (written by `clerk init`) stays ignored and is never read or printed.
8. `clerk init` may scaffold files that conflict with the existing design (its own layout edits,
   sign-in pages). Anything it adds that duplicates or restyles existing UI gets reverted; only the
   provider, env wiring and proxy are kept.

## Files expected to change

| File | Change |
| --- | --- |
| `package.json` / `package-lock.json` | `@clerk/nextjs` added by `clerk init` |
| `proxy.ts` (new, repo root) | `clerkMiddleware`, protects `/my-learning(.*)`, matcher includes `/(api\|trpc)(.*)` and `/__clerk/:path*` |
| `app/layout.tsx` | `ClerkProvider` inside `<body>` |
| `components/nav/site-header.tsx` | placeholder avatar → `<Show when="signed-in">` `UserButton` / `<Show when="signed-out">` sign-in + sign-up buttons |
| `.env.example` (new) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| `.gitignore` | `!.env.example` under the env block |
| `.env.local` | written by `clerk init`; gitignored, never read back |

## Requirements

- `ClerkProvider` inside `<body>`, never wrapping `<html>`.
- Any server-side auth read uses `await auth()` from `@clerk/nextjs/server` (async in Next 15+).
- Import from `@clerk/nextjs`, never `@clerk/clerk-react`.
- The matcher includes `'/(api|trpc)(.*)'` and `'/__clerk/:path*'` (the latter once, after it).
- The header keeps its existing 97px row, spacing and focus-ring convention; the signed-in control
  is visually the same 50px circle as today.
- Everything stays responsive down to mobile as the header already is.

## Security considerations

- `CLERK_SECRET_KEY` is server-only: it appears in `.env.local` and `.env.example` and is never
  referenced from a client component, never prefixed `NEXT_PUBLIC_`.
- Only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` reaches the browser.
- Route protection lives in `proxy.ts`, not in client code — a client-side check is a display
  concern, not a gate.
- `.env.local` is not read, printed, or committed; `.env.example` carries names with empty values.
- No write tokens, no Sanity token, no progress writes in this change.

## Acceptance criteria

1. `npx tsc --noEmit` clean.
2. `npm run lint` clean.
3. `npm run build` succeeds (routes and server config changed).
4. `clerk doctor` reports no errors.
5. Visiting `/` signed out shows Sign in / Sign up in the header; the page is fully browsable.
6. Signing up produces a 50px avatar in the header that opens the Clerk user menu.
7. Visiting `/my-learning` signed out redirects to `/sign-in?redirect_url=...`; signed in it 404s
   (route not built yet) rather than redirecting — proving the gate ran and passed.
8. `git status` shows no `.env.local` and no other secret file staged.

## Checks to run

```bash
npx tsc --noEmit
npm run lint
npm run build
clerk doctor
npm run dev   # manual pass below
```

## Manual test steps

1. `npm run dev`, open `http://localhost:3000`.
2. Header shows **Sign in** and **Sign up**; the hero, course cards and footer are unchanged from
   the current home page.
3. Click **Sign up**, create the first test user.
4. Header now shows the avatar circle; click it — the Clerk user menu opens.
5. Navigate to `http://localhost:3000/my-learning` → 404 (route not built), no redirect.
6. Sign out from the user menu → header returns to Sign in / Sign up.
7. Navigate to `http://localhost:3000/my-learning` signed out → redirected to Clerk sign-in.
8. Resize to 375px wide — the header still fits on one row without overflow.
