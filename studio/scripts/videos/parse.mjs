/**
 * The pure half of the video ingestion pipeline (AGENTS §9): turning one yt-dlp
 * info-json plus one WebVTT caption file into the `chapters` and `chunks` arrays of a
 * `video` document. No I/O, no dependencies — so `parse.check.mjs` runs it under plain
 * node.
 */

/**
 * The document id (§9): strip whatever the datastore rejects in an id.
 *
 * Sanity allows `[A-Za-z0-9._-]` but an id element may not START with `-` or `.`, and
 * roughly one YouTube id in 60 does (`-QVoIxEpFkM`) — the import fails outright on it.
 * Such an id gets a `v` prefix. Every YouTube id is 11 characters, so a prefixed id can
 * never collide with a real one, and the authoritative value stays in the `id` field.
 */
export function videoDocId(id) {
  const clean = String(id).replace(/[^A-Za-z0-9._-]/g, "")
  return `video.${/^[A-Za-z0-9_]/.test(clean) ? clean : `v${clean}`}`
}

/**
 * Byte-identical to the `videoUrl` the seed stores on every lesson — the model joins a
 * matched moment back to its lesson on url equality (§8), so this string has to match.
 */
export function watchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`
}

/** `HH:MM:SS.mmm` or `MM:SS.mmm` → seconds. `null` when it is neither. */
function cueSeconds(stamp) {
  const parts = stamp.split(":").map(Number)
  if (parts.some((part) => !Number.isFinite(part))) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

/**
 * The table of contents, from YouTube's own chapter markers. An empty array is a valid
 * outcome: no chapters means search falls back to the transcript (§7), and a label is
 * never invented.
 */
export function parseChapters(info) {
  const chapters = Array.isArray(info?.chapters) ? info.chapters : []
  return chapters
    .map((chapter) => ({
      startSeconds: Math.max(0, Math.floor(Number(chapter?.start_time ?? NaN))),
      label: String(chapter?.title ?? "").trim(),
    }))
    .filter((chapter) => Number.isFinite(chapter.startSeconds) && chapter.label)
    .map((chapter, index) => ({_key: `ch${index}`, _type: "videoChapter", ...chapter}))
}

/**
 * WebVTT → deduped `{startSeconds, text}` lines.
 *
 * YouTube's auto-captions scroll: each cue repeats the previous line and carries inline
 * `<00:00:00.440><c>word</c>` timings. So tags are stripped and a line is emitted only
 * when it differs from the last one emitted. The cue start is the timestamp; the
 * word-level timings are ignored.
 */
export function parseVtt(text) {
  const lines = []
  let startSeconds = null
  let last = null

  // Row by row rather than cue by cue: caption files disagree on whether the blank line
  // inside a scrolling cue is empty or a single space, so blocks are not a reliable unit.
  for (const raw of String(text).split(/\r?\n/)) {
    const timing = raw.match(/^([\d:.]+)\s+-->\s+[\d:.]+/)
    if (timing) {
      startSeconds = cueSeconds(timing[1])
      continue
    }
    // Rows before the first cue are the WEBVTT header; a bare number is a cue identifier.
    if (startSeconds === null || /^\d+$/.test(raw.trim())) continue

    const line = raw
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!line || line === last) continue
    lines.push({startSeconds, text: line})
    last = line
  }

  return lines
}

/**
 * The transcript as short timestamped pieces (§8/§9) — never one field a query could
 * return wholesale. A chunk flushes at `maxSeconds` of span or `maxChars` of text,
 * whichever comes first, and is timestamped at its first line.
 */
export function chunk(lines, {maxSeconds = 30, maxChars = 300} = {}) {
  const chunks = []
  let current = null

  for (const line of lines) {
    const tooLong = current && current.text.length + 1 + line.text.length > maxChars
    const tooOld = current && line.startSeconds - current.startSeconds >= maxSeconds
    if (!current || tooLong || tooOld) {
      if (current) chunks.push(current)
      current = {startSeconds: Math.floor(line.startSeconds), text: line.text}
      continue
    }
    current.text += ` ${line.text}`
  }
  if (current) chunks.push(current)

  return chunks.map((piece, index) => ({_key: `ck${index}`, _type: "videoChunk", ...piece}))
}

/** One `video` document, ready for `sanity dataset import`. */
export function videoDocument(id, info, vtt) {
  return {
    _id: videoDocId(id),
    _type: "video",
    id: String(id),
    url: watchUrl(id),
    chapters: parseChapters(info),
    chunks: chunk(parseVtt(vtt ?? "")),
  }
}
