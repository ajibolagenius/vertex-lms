/**
 * The offline video ingestion pipeline (AGENTS §9).
 *
 *   node scripts/videos/ingest.mjs [--limit N] [--refresh]
 *
 * Reads the lesson -> video manifest, pulls each video's chapter markers and English
 * captions with `yt-dlp` into a local cache, and writes one `video` document per unique
 * video URL to `videos.ndjson` for `sanity dataset import`.
 *
 * Offline by definition: it never runs in the request path, needs no Sanity token (the
 * import runs on the CLI's own auth), and is safe to re-run — the cache makes a second
 * run near-instant and the document ids are stable, so the import is idempotent.
 *
 * Prerequisite: `yt-dlp` on PATH (`brew install yt-dlp`).
 */
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import {videoDocument, watchUrl} from './parse.mjs'

const HERE = import.meta.dirname
const MANIFEST = path.join(HERE, '..', 'seed', 'videos.json')
const SEED = path.join(HERE, '..', 'seed', 'seed.ndjson')
const CACHE = path.join(HERE, '.cache')
const OUT = path.join(HERE, 'videos.ndjson')
/** Manual `en` first, then YouTube's auto tracks. */
const SUB_PREFERENCE = ['en', 'en-orig', 'en-US', 'en-GB']

const args = process.argv.slice(2)
const limit = Number(args[args.indexOf('--limit') + 1]) || Infinity
const refresh = args.includes('--refresh')

/** slug -> videoUrl, straight from the seed, so a drifted manifest fails loudly. */
function seedVideoUrls() {
  const urls = new Map()
  for (const line of fs.readFileSync(SEED, 'utf8').split('\n')) {
    if (!line.trim()) continue
    const doc = JSON.parse(line)
    if (doc._type === 'lesson') urls.set(doc.slug?.current, doc.videoUrl)
  }
  return urls
}

function cachedSubtitle(id) {
  const files = fs.existsSync(CACHE) ? fs.readdirSync(CACHE) : []
  const mine = files.filter((file) => file.startsWith(`${id}.`) && file.endsWith('.vtt'))
  const preferred = SUB_PREFERENCE.map((lang) => `${id}.${lang}.vtt`).find((file) =>
    mine.includes(file),
  )
  const file = preferred ?? mine.find((name) => name.includes('.en'))
  return file ? path.join(CACHE, file) : null
}

/**
 * Fills the cache for one video. Returns an error string, or `null` on success.
 *
 * `langs` is a yt-dlp subtitle-language pattern. Callers pass the narrow `en` first —
 * every extra track is another request towards a 429 — and widen only if nothing lands.
 */
function fetchVideo(id, langs) {
  const result = spawnSync(
    'yt-dlp',
    [
      '--skip-download',
      '--write-info-json',
      '--write-subs',
      '--write-auto-subs',
      '--sub-langs',
      langs,
      '--sub-format',
      'vtt',
      // YouTube rate-limits caption downloads, so let yt-dlp back off on its own.
      '--sleep-subtitles',
      '1',
      '--retries',
      '5',
      '--retry-sleep',
      'http:exp=3:60',
      '--no-progress',
      '--no-warnings',
      '-o',
      path.join(CACHE, '%(id)s'),
      watchUrl(id),
    ],
    {encoding: 'utf8'},
  )

  if (result.error?.code === 'ENOENT') {
    console.error('yt-dlp is not on PATH. Install it with: brew install yt-dlp')
    process.exit(1)
  }
  if (result.status !== 0) {
    return (result.stderr || result.stdout || '').trim().split('\n').pop() || 'yt-dlp failed'
  }
  return null
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
const seedUrls = seedVideoUrls()
fs.mkdirSync(CACHE, {recursive: true})

const failures = []
const chapterless = []
const transcriptless = []
const docs = new Map()
let fetched = 0
let cached = 0

const entries = Object.entries(manifest).slice(0, limit === Infinity ? undefined : limit)

for (const [slug, entry] of entries) {
  const id = entry?.id
  if (!id) {
    failures.push(`${slug}: manifest entry has no video id`)
    continue
  }

  // The manifest is only useful if it still describes the video the lesson actually plays.
  const lessonUrl = seedUrls.get(slug)
  if (lessonUrl && lessonUrl !== watchUrl(id)) {
    failures.push(`${slug}: manifest id ${id} does not match lesson videoUrl ${lessonUrl}`)
    continue
  }
  if (docs.has(id)) continue

  const infoPath = path.join(CACHE, `${id}.info.json`)
  if (!refresh && fs.existsSync(infoPath) && cachedSubtitle(id)) {
    cached += 1
  } else {
    // Sequential with a pause: a rate-limited video can then be retried on its own
    // instead of the whole run starting over.
    if (fetched > 0) await new Promise((resolve) => setTimeout(resolve, 1_500))
    fetched += 1
    process.stdout.write(`fetching ${id} (${slug})… `)
    const error = fetchVideo(id, 'en')
    // Some videos publish only a regional track (en-US, en-GB) or the original-language
    // one (en-orig), which the narrow pattern does not match. Best-effort: a 429 on this
    // second pass still leaves the info.json, so the chapters survive.
    if (!error && !cachedSubtitle(id)) fetchVideo(id, 'en.*')
    if (error) {
      console.log('failed')
      failures.push(`${slug} (${id}): ${error}`)
      continue
    }
    console.log('ok')
  }

  const subtitle = cachedSubtitle(id)
  const doc = videoDocument(
    id,
    JSON.parse(fs.readFileSync(infoPath, 'utf8')),
    subtitle ? fs.readFileSync(subtitle, 'utf8') : '',
  )

  if (!doc.chapters.length && !doc.chunks.length) {
    // Nothing to match on means no moment can ever resolve — better absent than empty.
    failures.push(`${slug} (${id}): no chapters and no captions`)
    continue
  }
  if (!doc.chapters.length) chapterless.push(id)
  if (!doc.chunks.length) transcriptless.push(id)

  docs.set(id, doc)
}

const ordered = [...docs.values()]
assert.ok(
  ordered.every((doc) => doc.chunks.every((c, i, a) => i === 0 || c.startSeconds >= a[i - 1].startSeconds)),
  'chunk timestamps must be non-decreasing',
)

fs.writeFileSync(OUT, ordered.map((doc) => JSON.stringify(doc)).join('\n') + '\n')

console.log(`\n${ordered.length} video documents -> ${path.relative(process.cwd(), OUT)}`)
console.log(`${fetched} fetched, ${cached} from cache`)
console.log(
  `chapters: ${ordered.length - chapterless.length}/${ordered.length} videos have them` +
    `, ${chapterless.length} are transcript-only`,
)
console.log(
  `chunks: ${ordered.reduce((sum, doc) => sum + doc.chunks.length, 0)} total` +
    `, ${transcriptless.length} videos have no captions and resolve on chapters alone`,
)

if (failures.length) {
  console.error(`\n${failures.length} failed:`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exitCode = 1
}
