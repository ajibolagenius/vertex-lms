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
