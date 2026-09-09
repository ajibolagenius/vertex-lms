import {defineField, defineType} from 'sanity'
import {ClockIcon} from '@sanity/icons'

/**
 * A learner's state for one lesson, keyed by the Clerk user id (AGENTS §8).
 *
 * App state, not authored content: written only by `app/api/progress/route.ts` with a
 * write token, read-only here, and outside the search Context document's type whitelist
 * so the agent never sees it.
 *
 * One document per (learner, lesson) with a deterministic `_id` —
 * `progress.<clerkUserId>.<lessonId>` — so a write is a create-if-missing plus a set,
 * with no read-modify-write and no keyed-array patching to lose a concurrent update.
 */
export const progress = defineType({
  name: 'progress',
  title: 'Learner progress',
  type: 'document',
  icon: ClockIcon,
  readOnly: true,
  fields: [
    defineField({
      name: 'userId',
      title: 'Clerk user id',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lesson',
      type: 'reference',
      to: [{type: 'lesson'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'completed',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'positionSeconds',
      title: 'Resume position (seconds)',
      description: 'Where the learner left off. Lesson-level today — see the route.',
      type: 'number',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'updatedAt',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {title: 'lesson.title', userId: 'userId', completed: 'completed'},
    prepare({title, userId, completed}) {
      return {title: title ?? 'Lesson', subtitle: `${userId} — ${completed ? 'complete' : 'in progress'}`}
    },
  },
})
