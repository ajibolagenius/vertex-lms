import {defineArrayMember, defineField, defineType} from 'sanity'
import {ThListIcon} from '@sanity/icons'

/**
 * Embedded in `course.modules`, not its own document (AGENTS §8).
 * "Module 5 of 12" is derived from position, never stored.
 */
export const courseModule = defineType({
  name: 'module',
  title: 'Module',
  type: 'object',
  icon: ThListIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lessons',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'lesson'}]})],
      validation: (rule) => rule.required().min(1).unique(),
    }),
  ],
  preview: {
    select: {title: 'title', lessons: 'lessons'},
    prepare({title, lessons}) {
      const count = lessons?.length ?? 0
      return {title, subtitle: `${count} lesson${count === 1 ? '' : 's'}`}
    },
  },
})
