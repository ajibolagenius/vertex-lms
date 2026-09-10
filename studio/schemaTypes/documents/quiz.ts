import {defineArrayMember, defineField, defineType} from 'sanity'
import {CheckmarkCircleIcon} from '@sanity/icons'

/**
 * A lesson's quiz: generated offline from its transcript by `studio/scripts/quizzes/`,
 * one document per lesson, `_id: "quiz.<lesson slug>"`.
 *
 * Its own document type rather than a field on `lesson`, for the same reason `video` is:
 * generated artefacts stay out of author-owned documents, and a stable id means the
 * import is a whole-document `--replace` needing no write token.
 */
export const quiz = defineType({
  name: 'quiz',
  title: 'Lesson quiz',
  type: 'document',
  icon: CheckmarkCircleIcon,
  fields: [
    defineField({
      name: 'lesson',
      type: 'reference',
      to: [{type: 'lesson'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lessonSlug',
      description: 'Denormalised so the generator can build a stable id without a lookup.',
      type: 'string',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'questions',
      type: 'array',
      of: [defineArrayMember({type: 'quizQuestion'})],
      validation: (rule) => rule.required().min(1).max(8),
    }),
  ],
  preview: {
    select: {title: 'lessonSlug', questions: 'questions'},
    prepare({title, questions}) {
      return {title, subtitle: `${questions?.length ?? 0} questions`}
    },
  },
})
