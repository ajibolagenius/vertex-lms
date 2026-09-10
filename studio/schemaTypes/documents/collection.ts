import {defineArrayMember, defineField, defineType} from 'sanity'
import {BookmarkIcon} from '@sanity/icons'

/**
 * A collection of lessons (AGENTS §8): either an author-curated learning path
 * published in the Studio (where `owner` is undefined), or a learner's personal list
 * saved via the site (where `owner` is their Clerk user id).
 *
 * Same type, same rendering, no second code path.
 */
export const collection = defineType({
  name: 'collection',
  title: 'Collection',
  type: 'document',
  icon: BookmarkIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'owner',
      title: 'Owner (Clerk user id)',
      description:
        'Blank for author-curated learning paths; set to a Clerk user id for personal lists.',
      type: 'string',
    }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'lesson'}],
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      owner: 'owner',
      lessons: 'lessons',
    },
    prepare({title, owner, lessons}) {
      const count = lessons?.length ?? 0
      const tag = owner ? 'Personal' : 'Curated'
      return {
        title: title || 'Untitled collection',
        subtitle: `${tag} · ${count} lesson${count === 1 ? '' : 's'}`,
      }
    },
  },
})
