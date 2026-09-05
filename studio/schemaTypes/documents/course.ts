import {defineArrayMember, defineField, defineType} from 'sanity'
import {BookIcon} from '@sanity/icons'

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  icon: BookIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'marketing', title: 'Marketing'},
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      group: 'marketing',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'marketing',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'level',
      type: 'string',
      group: 'marketing',
      options: {
        list: [
          {title: 'Beginner', value: 'beginner'},
          {title: 'Intermediate', value: 'intermediate'},
          {title: 'Advanced', value: 'advanced'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      description: 'Authored figure shown on the course page.',
      type: 'number',
      group: 'marketing',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'popular',
      description: 'Shows the POPULAR badge on the course page.',
      type: 'boolean',
      group: 'marketing',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      title: 'Student count',
      description: 'Authored figure shown on the course page.',
      type: 'number',
      group: 'marketing',
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: 'learningOutcomes',
      title: "What you'll learn",
      type: 'array',
      group: 'marketing',
      of: [defineArrayMember({type: 'learningOutcome'})],
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: 'instructor',
      type: 'reference',
      group: 'content',
      to: [{type: 'instructor'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'reference',
      group: 'content',
      to: [{type: 'category'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'modules',
      description: 'Ordered. "Module 5 of 12" is derived from this order.',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'module'})],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'coverImage',
      level: 'level',
      modules: 'modules',
    },
    prepare({title, media, level, modules}) {
      const count = modules?.length ?? 0
      return {
        title,
        media,
        subtitle: `${level ?? 'no level'} · ${count} module${count === 1 ? '' : 's'}`,
      }
    },
  },
})
