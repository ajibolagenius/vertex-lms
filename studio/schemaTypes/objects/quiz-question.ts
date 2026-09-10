import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * One multiple-choice question, generated from a lesson's own transcript by
 * `studio/scripts/quizzes/` — never authored by hand, though an author may correct one.
 *
 * `startSeconds` is where the answer is taught, so a wrong answer can offer to play that
 * moment. Like every other timestamp in the project it comes from an ingested chunk and
 * is never computed (AGENTS §7).
 */
export const quizQuestion = defineType({
  name: 'quizQuestion',
  title: 'Question',
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'options',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.required().min(2).max(5),
    }),
    defineField({
      name: 'answerIndex',
      title: 'Correct option (0-based)',
      type: 'number',
      validation: (rule) =>
        rule
          .required()
          .integer()
          .min(0)
          .custom((value, context) => {
            const options = (context.parent as {options?: unknown[]})?.options ?? []
            if (typeof value !== 'number' || value < options.length) return true
            return `Only ${options.length} options — the answer index must be below that.`
          }),
    }),
    defineField({
      name: 'explanation',
      description: 'One sentence, grounded in what the lesson actually says.',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'startSeconds',
      title: 'Taught at (seconds)',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0),
    }),
  ],
  preview: {
    select: {title: 'question', startSeconds: 'startSeconds'},
    prepare({title, startSeconds}) {
      return {title, subtitle: `${startSeconds ?? 0}s`}
    },
  },
})
