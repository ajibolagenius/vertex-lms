import {defineQuery} from 'next-sanity'

/**
 * Every GROQ query in the web workspace. TypeGen only scans this directory
 * (see studio/sanity.cli.ts), so new queries belong here.
 *
 * Nothing here touches a token — these are strings. The server boundary is
 * `client.ts` / `fetch.ts`.
 *
 * Durations are stored per lesson in seconds; course and module totals are summed
 * in the projection rather than denormalised onto the document (AGENTS §8).
 */

const COURSE_CARD_FIELDS = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  summary,
  coverImage,
  level,
  popular,
  studentCount,
  category->{title, "slug": slug.current},
  "moduleCount": count(modules),
  "lessonCount": count(modules[].lessons[]),
  "duration": math::sum(modules[].lessons[]->duration)
`

export const COURSES_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && defined(slug.current)] | order(popular desc, title asc) {
    ${COURSE_CARD_FIELDS}
  }
`)

export const COURSE_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && slug.current == $slug][0] {
    ${COURSE_CARD_FIELDS},
    price,
    instructor->{
      _id,
      name,
      "slug": slug.current,
      photo,
      expertise
    },
    learningOutcomes[]{
      _key,
      icon,
      title,
      description
    },
    modules[]{
      _key,
      title,
      summary,
      "duration": math::sum(lessons[]->duration),
      lessons[]->{
        _id,
        title,
        "slug": slug.current,
        duration,
        freePreview
      }
    }
  }
`)

/**
 * A lesson stores no parent course, so the course is found by reverse reference.
 * The full module tree comes back because the lesson page's sidebar renders it and
 * derives "Module 5 of 12" / "Lesson 5.1" from position.
 */
export const LESSON_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "lesson" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    videoUrl,
    thumbnail,
    duration,
    freePreview,
    studentCount,
    notes,
    keyPoints,
    proTip,
    resources[]{
      _key,
      type,
      title,
      description,
      url
    },
    "course": *[_type == "course" && references(^._id)][0]{
      _id,
      title,
      "slug": slug.current,
      coverImage,
      level,
      instructor->{name, "slug": slug.current, photo},
      modules[]{
        _key,
        title,
        "duration": math::sum(lessons[]->duration),
        lessons[]->{
          _id,
          title,
          "slug": slug.current,
          duration
        }
      }
    }
  }
`)

export const INSTRUCTOR_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "instructor" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    photo,
    expertise,
    bio,
    "courses": *[_type == "course" && instructor._ref == ^._id] | order(popular desc, title asc) {
      ${COURSE_CARD_FIELDS}
    }
  }
`)

export const COURSE_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && defined(slug.current)].slug.current
`)

export const LESSON_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "lesson" && defined(slug.current)].slug.current
`)

/**
 * Everything a search result card renders. Both search reads project it, so a card
 * cannot end up with a field one path has and the other does not.
 *
 * The parent course arrives by reverse reference, with its module tree flattened to
 * lesson ids only — that is all `lib/search/rank.ts` needs to derive the module title
 * and the positional "5.1" label.
 */
const SEARCH_CARD_FIELDS = /* groq */ `
  _id,
  _createdAt,
  title,
  "slug": slug.current,
  duration,
  videoUrl,
  keyPoints,
  "thumbnailRef": thumbnail.asset._ref,
  "course": *[_type == "course" && references(^._id)][0]{
    title,
    "slug": slug.current,
    "iconRef": coverImage.asset._ref,
    modules[]{
      title,
      "lessonIds": lessons[]._ref
    }
  }
`

/**
 * The search grounding read (AGENTS §7): the model returns lesson ids, and every field
 * the results page renders comes from here instead of from the model.
 */
export const LESSONS_BY_IDS_QUERY = defineQuery(/* groq */ `
  *[_type == "lesson" && _id in $ids] {
    ${SEARCH_CARD_FIELDS}
  }
`)

/**
 * The match step of the keyword search the route falls back to when the model is
 * unavailable (§11).
 *
 * Both ways in one pass, then merged: a lesson matches on its own topic ("title",
 * "pt::text(notes)", "keyPoints") *or* on a moment in its video ("chapters[].label",
 * "chunks[].text"), so a concept taught mid-video surfaces even when the lesson text
 * never names it.
 *
 * `$terms` is an array of already-wildcarded tokens, passed as a parameter — a learner's
 * query is never interpolated into GROQ. Matching is token-based because `match` against
 * an array of patterns is AND, not OR: the count-terms form below ORs them.
 *
 * Deliberately cheap: ids, the ranking signals and the matched seconds, and nothing a card
 * renders. The reverse-referenced course is 90-odd subqueries on a broad query, so the card
 * fields are read afterwards by `LESSONS_BY_IDS_QUERY` for the winners only. Moments are
 * filtered inside the projection and capped at three, so no whole `chunks` array is read
 * back (§12).
 *
 * Each `*Terms` projection returns WHICH terms hit that field: their length is the ranking
 * weight, and their union is how many of the learner's words the lesson covers at all.
 */
export const SEARCH_LESSONS_QUERY = defineQuery(/* groq */ `
  *[_type == "lesson" && defined(slug.current) && (
    count($terms[^.title match @ || pt::text(^.notes) match @ || ^.keyPoints[] match @]) > 0 ||
    count(*[_type == "video" && url == ^.videoUrl &&
      count($terms[^.chapters[].label match @ || ^.chunks[].text match @]) > 0
    ]) > 0
  )] {
    _id,
    title,
    "notesText": pt::text(notes),
    "titleTerms": $terms[^.title match @],
    "keyPointTerms": $terms[^.keyPoints[] match @],
    "notesTerms": $terms[pt::text(^.notes) match @],
    "video": *[_type == "video" && url == ^.videoUrl][0]{
      "videoTerms": $terms[^.chapters[].label match @ || ^.chunks[].text match @],
      "chapterMoments": chapters[count($terms[^.label match @]) > 0][0...3]{startSeconds},
      "transcriptMoments": chunks[count($terms[^.text match @]) > 0][0...3]{startSeconds}
    }
  }
`)

/**
 * Every progress record for one learner (AGENTS §8). Keyed off the Clerk user id, which the
 * route and the page read from `auth()` — never from a query param.
 *
 * The parent course arrives by reverse reference, with the module tree flattened to lesson ids
 * because that count is the denominator of the course's percentage. Grouping and the resume
 * pick happen in `lib/progress.ts` rather than in GROQ, so they are testable.
 */
export const PROGRESS_BY_USER_QUERY = defineQuery(/* groq */ `
  *[_type == "progress" && userId == $userId] | order(updatedAt desc) {
    completed,
    positionSeconds,
    updatedAt,
    "lessonId": lesson._ref,
    lesson->{
      title,
      "slug": slug.current
    },
    "course": *[_type == "course" && references(^.lesson._ref)][0]{
      title,
      "slug": slug.current,
      "lessonIds": modules[].lessons[]._ref
    }
  }
`)

/**
 * The transcript panel's read (AGENTS §9). Keyed by the lesson's `videoUrl` — that
 * equality is the only join between a lesson and its video document.
 *
 * This is the one place a whole `chunks` array is read, and it is read for exactly one
 * video, to render. It never reaches the model: §12's rule is about what the search route
 * puts in a prompt, and that path still filters to a few matched chunks.
 */
export const VIDEO_BY_URL_QUERY = defineQuery(/* groq */ `
  *[_type == "video" && url == $url][0] {
    "id": id,
    chapters[]{_key, startSeconds, label},
    chunks[]{_key, startSeconds, text}
  }
`)
