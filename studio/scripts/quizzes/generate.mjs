/**
 * The offline quiz generator (AGENTS §9's pattern, applied to quizzes).
 *
 *   OPENAI_API_KEY=... node scripts/quizzes/generate.mjs [--limit N] [--only <slug>] [--force]
 *
 * Reads the seed's lessons and the ingested `videos.ndjson`, asks a model for a few
 * multiple-choice questions per lesson, and writes one `quiz` document per lesson to
 * `quizzes.ndjson` for `sanity dataset import --replace`.
 *
 * Offline by definition: it never runs in the request path, needs no Sanity token (the
 * import runs on the CLI's own auth), and ids are stable, so it is re-runnable. Existing
 * output is kept unless `--force`, so a re-run only fills the gaps — model calls cost
 * money and there is no reason to buy the same question twice.
 *
 * Grounding is checked here, not trusted: every question's `startSeconds` must be one of
 * the chunk seconds this script actually sent, and `answerIndex` must point at a real
 * option. Anything else is dropped with a reason, and a lesson left with no usable
 * question is skipped rather than written half-formed.
 */
import fs from 'node:fs'
import path from 'node:path'

const HERE = import.meta.dirname
const SEED = path.join(HERE, '..', 'seed', 'seed.ndjson')
const VIDEOS = path.join(HERE, '..', 'videos', 'videos.ndjson')
const OUT = path.join(HERE, 'quizzes.ndjson')

const MODEL = process.env.OPENAI_QUIZ_MODEL || 'gpt-5'
/** Excerpts sent per lesson. Enough to cover a video, small enough to stay cheap. */
const EXCERPTS = 16
const QUESTIONS = 4

const args = process.argv.slice(2)
const limit = Number(args[args.indexOf('--limit') + 1]) || Infinity
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
const force = args.includes('--force')

function readNdjson(file) {
  if (!fs.existsSync(file)) return []
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line))
}

/** Evenly spaced, so the questions cover the whole video rather than its first minute. */
function spread(items, count) {
  if (items.length <= count) return items
  const step = items.length / count
  return Array.from({length: count}, (_, i) => items[Math.floor(i * step)])
}

const PROMPT = `You write short comprehension quizzes for an online course.

Rules:
- Write exactly ${QUESTIONS} multiple-choice questions about what THIS lesson teaches,
  using only the excerpts given. Never use outside knowledge.
- Each question has 3 or 4 options, exactly one correct.
- Wrong options must be plausible and about the same topic. Never use "all of the above",
  "none of the above", or an option that is obviously silly.
- "startSeconds" MUST be copied from the excerpt the question comes from. Never invent one.
- "explanation" is one sentence saying why the answer is right, grounded in the excerpt.
- Return JSON: {"questions":[{"question":"","options":["",""],"answerIndex":0,"explanation":"","startSeconds":0}]}`

async function generate(lesson, excerpts) {
  const body = {
    model: MODEL,
    input: [
      {role: 'system', content: PROMPT},
      {
        role: 'user',
        content: [
          `Lesson: ${lesson.title}`,
          lesson.keyPoints?.length ? `Key points:\n- ${lesson.keyPoints.join('\n- ')}` : '',
          'Excerpts (startSeconds | text):',
          excerpts.map((e) => `${e.startSeconds} | ${e.text.replace(/\s+/g, ' ')}`).join('\n'),
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ],
    text: {format: {type: 'json_object'}},
    reasoning: {effort: 'low'},
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)

  const data = await response.json()
  const text =
    data.output_text ??
    data.output?.flatMap((item) => item.content ?? []).find((part) => part.text)?.text
  if (!text) throw new Error('no text in response')
  return JSON.parse(text).questions ?? []
}

/** Everything the model is allowed to have got wrong, caught before it is written. */
function usable(questions, seconds) {
  const kept = []
  for (const [index, q] of questions.entries()) {
    const options = Array.isArray(q?.options) ? q.options.filter((o) => typeof o === 'string' && o.trim()) : []
    const why =
      !q?.question?.trim() ? 'no question'
      : options.length !== (Array.isArray(q.options) ? q.options.length : -1) ? 'blank option'
      : options.length < 2 || options.length > 5 ? 'option count'
      : !Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= options.length ? 'answerIndex'
      : !q?.explanation?.trim() ? 'no explanation'
      : !seconds.has(q.startSeconds) ? 'invented startSeconds'
      : null
    if (why) {
      console.warn(`    dropped question ${index + 1}: ${why}`)
      continue
    }
    kept.push({
      _key: `q${index}`,
      _type: 'quizQuestion',
      question: q.question.trim(),
      options,
      answerIndex: q.answerIndex,
      explanation: q.explanation.trim(),
      startSeconds: q.startSeconds,
    })
  }
  return kept
}

const chunksByUrl = new Map(readNdjson(VIDEOS).map((video) => [video.url, video.chunks ?? []]))
const existing = new Map(force ? [] : readNdjson(OUT).map((doc) => [doc._id, doc]))

const lessons = readNdjson(SEED)
  .filter((doc) => doc._type === 'lesson' && doc.slug?.current)
  .filter((doc) => (only ? doc.slug.current === only : true))
  .slice(0, limit)

const written = []
let skipped = 0

for (const lesson of lessons) {
  const slug = lesson.slug.current
  const _id = `quiz.${slug}`

  if (existing.has(_id)) {
    written.push(existing.get(_id))
    continue
  }

  const chunks = (chunksByUrl.get(lesson.videoUrl) ?? []).filter(
    (chunk) => Number.isInteger(chunk.startSeconds) && chunk.text?.trim(),
  )
  if (!chunks.length) {
    console.warn(`  ${slug}: no ingested transcript — skipped`)
    skipped += 1
    continue
  }

  const excerpts = spread(chunks, EXCERPTS)
  const seconds = new Set(excerpts.map((chunk) => chunk.startSeconds))

  process.stdout.write(`  ${slug} … `)
  let questions
  try {
    questions = usable(await generate(lesson, excerpts), seconds)
  } catch (error) {
    console.warn(`failed: ${error.message}`)
    skipped += 1
    continue
  }

  if (!questions.length) {
    console.warn('no usable questions — skipped')
    skipped += 1
    continue
  }

  console.log(`${questions.length} questions`)
  written.push({
    _id,
    _type: 'quiz',
    lesson: {_type: 'reference', _ref: lesson._id},
    lessonSlug: slug,
    questions,
  })
}

if (!written.length) {
  // Nothing to import, and an empty file would only make the next step look broken.
  console.log(`\nNo quizzes generated (${skipped} skipped). ${OUT} left untouched.`)
  process.exit(skipped ? 1 : 0)
}

fs.writeFileSync(OUT, written.map((doc) => JSON.stringify(doc)).join('\n') + '\n')
console.log(`\n${written.length} quizzes in ${path.relative(process.cwd(), OUT)} (${skipped} skipped)`)
