import {defineArrayMember, defineField, defineType} from 'sanity'
import {PlayIcon} from '@sanity/icons'

/**
 * A lesson stores no parent course (AGENTS §8) — the course is derived with a
 * reverse reference, so a lesson can be referenced without an ownership field
 * drifting out of sync.
 */
export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  icon: PlayIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'video', title: 'Video'},
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
      name: 'videoUrl',
      title: 'Video URL',
      description: 'YouTube, Vimeo or Bunny. Played as an embed on the lesson page.',
      type: 'url',
      group: 'video',
      validation: (rule) => rule.required().uri({scheme: ['https']}),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Poster image',
      type: 'image',
      group: 'video',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      description: 'Stored in seconds. "1h 28m" is formatted at render time.',
      type: 'number',
      group: 'video',
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'freePreview',
      title: 'Free preview',
      description: 'A badge only — this does not grant or restrict access.',
      type: 'boolean',
      group: 'content',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      title: 'Student count',
      description: 'Authored figure shown on the lesson page.',
      type: 'number',
      group: 'content',
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      description: 'The lesson Overview prose.',
      type: 'blockContent',
      group: 'content',
    }),
    defineField({
      name: 'keyPoints',
      title: 'Key points',
      description: 'The "In this lesson you will:" checklist.',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'proTip',
      title: 'Pro tip',
      type: 'text',
      group: 'content',
      rows: 3,
    }),
    defineField({
      name: 'resources',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'resource'})],
    }),
  ],
  preview: {
    select: {title: 'title', media: 'thumbnail', duration: 'duration'},
    prepare({title, media, duration}) {
      const minutes = Math.round((duration ?? 0) / 60)
      return {title, media, subtitle: `${minutes}m`}
    },
  },
})
