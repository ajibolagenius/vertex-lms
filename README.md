# Vertex

Vertex is an AI-powered learning platform with intelligent content search. Authors create courses in Sanity, and a Next.js App Router site serves them to learners. What sets Vertex apart is grounded video-moment search: a learner types a plain language query and receives ranked, clickable cards that link directly to the exact second in a lesson's video where that topic is taught.

---

## Features

- **Grounded Video Search**: Powered by the Sanity Context MCP and LLM, matching against structured chapters and timestamped transcript chunks with deep-links (`?t=`).
- **"Signal" Design Language**: Custom theme with Light and Dark modes, Space Mono data tokens, and zero-flash theme persistence.
- **In-Lesson Transcript**: Interactive transcript panel with live video seeking and auto-follow.
- **Ask This Lesson**: AI-powered lesson Q&A grounded on lesson transcripts with verified citation timestamps.
- **Quizzes & Streaks**: Offline-generated lesson quizzes, client-side grading, and activity streak tracking.
- **Collections & Learning Paths**: Author-curated learning paths and learner personal lists with fine-grained access control.
- **Progress & Analytics**: Per-learner lesson completion and playback resume tracking with PostHog engagement analytics.
- **PWA & Packaging**: Installable standalone Progressive Web App with offline fallback shell, multi-density maskable icons, and mobile safe-area support.

---

## Tech Stack

- **Framework**: Next.js (App Router, Turbopack, React 19)
- **CMS**: Sanity Studio v5 with GROQ, TypeGen, and Portable Text
- **Authentication**: Clerk (server-side `auth()`, route middleware in `proxy.ts`)
- **Search & AI**: Sanity Context MCP, Vercel AI SDK, OpenAI
- **Product Analytics**: PostHog (`posthog-js`, `posthog-node`)
- **Styling**: Tailwind CSS v4, Inter, Space Mono, Orbitron
- **PWA**: Service Worker (`public/sw.js`), Web App Manifest (`app/manifest.ts`), Sharp

---

## Getting Started

### 1. Install dependencies

```bash
npm install
npm --prefix studio install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and populate the required keys:

```bash
cp .env.example .env.local
```

### 3. Run development servers

Run Next.js:
```bash
npm run dev
```

Run Sanity Studio:
```bash
npm --prefix studio run dev
```

---

## Progressive Web App (PWA) & Packaging

Vertex includes standalone PWA capabilities designed for desktop, iOS, and Android:

- **Web App Manifest**: Served via `app/manifest.ts` and `public/manifest.json`, specifying `display: "standalone"`, Signal theme colors (`#5B4BE8` / `#0B0C0E`), and portrait orientation.
- **Brand Icons**:
  - `public/favicon.ico`: 32x32 favicon
  - `public/icons/apple-touch-icon.png`: 180x180 iOS home screen icon
  - `public/icons/icon-192.png` & `public/icons/icon-512.png`: standard PWA app icons
  - `public/icons/maskable-icon-512.png`: 512x512 adaptive icon with safe-zone padding
  - Re-generate anytime with `node scripts/generate-icons.mjs`.
- **Service Worker (`public/sw.js`)**:
  - Pre-caches the offline shell (`/offline`) and core brand assets.
  - Runtime caches Next.js static bundles (`/_next/static/*`), fonts, and images.
  - **Strict Security Rule**: Never caches API endpoints (`/api/*`), authentication routes (`/sign-in`, `/sign-up`, `/__clerk/*`), or non-GET requests.
- **Mobile Safe Area**: Handled in `app/globals.css` using `env(safe-area-inset-*)` for notched displays and gesture bars.

---

## Verification & Checks

Run the automated check suites:

```bash
# Packaging and PWA manifest / icons / service worker check
npm run check:packaging

# Feature and algorithmic check suites
npm run check:collections  # Collection helpers and ownership logic
npm run check:quiz         # Quiz scoring and question validation
npm run check:streak       # Streak calculation from UTC timestamps
npm run check:lesson-qa    # Lesson Q&A context selection & chunk bounds
npm run check:transcript   # Transcript grouping and seek logic
npm run check:progress     # Learner progress grouping and resume picks
npm run check:keyword      # Keyword search tokenizer and ranking
npm run check:video        # Video duration and provider id parsing
npm run check:rank         # Grounding and search ranking

# Static analysis and production build
npx tsc --noEmit
npm run lint
npm run build
```
