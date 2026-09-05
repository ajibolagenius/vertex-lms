import {defineField, defineType} from 'sanity'
import {SparklesIcon} from '@sanity/icons'

/** One card in the course page's "What you'll learn" grid. */
export const learningOutcome = defineType({
  name: 'learningOutcome',
  title: 'Learning outcome',
  type: 'object',
  icon: SparklesIcon,
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      options: {
        list: [
          {title: 'Layers', value: 'layers'},
          {title: 'Workflow', value: 'workflow'},
          {title: 'Gauge', value: 'gauge'},
          {title: 'Rocket', value: 'rocket'},
          {title: 'Sparkles', value: 'sparkles'},
          {title: 'Shield', value: 'shield'},
          {title: 'Puzzle', value: 'puzzle'},
          {title: 'Code', value: 'code'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'description'},
  },
})
