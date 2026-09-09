import {defineArrayMember, defineField, defineType} from 'sanity'
import {PlayIcon} from '@sanity/icons'

/**
 * Video intelligence for one unique video URL (AGENTS §8).
 *
 * Written by the offline ingestion pipeline (`studio/scripts/videos/`), never by hand —
 * every field is read-only in the Studio. Search treats these as an internal lookup and
 * never shows one as a result: a matched moment is tied back to the lesson whose
 * `videoUrl` equals this `url`, which is why `url` must stay byte-identical to it.
 *
 * The transcript lives in `chunks` as many short timestamped pieces, deliberately never
 * in one field a query could return wholesale (§12).
 */
export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  icon: PlayIcon,
  readOnly: true,
  fields: [
    defineField({
      name: 'id',
      title: 'Provider video id',
      description: 'The YouTube id. The document _id is "video.<id>".',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Video URL',
      description: 'Matches the lesson videoUrl exactly — that equality is the join.',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['https']}),
    }),
    defineField({
      name: 'chapters',
      title: 'Table of contents',
      description: 'The provider’s chapter markers. Matched before the transcript (§7).',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'videoChapter',
          title: 'Chapter',
          type: 'object',
          fields: [
            defineField({
              name: 'startSeconds',
              type: 'number',
              validation: (rule) => rule.required().integer().min(0),
            }),
            defineField({
              name: 'label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'label', startSeconds: 'startSeconds'},
            prepare({title, startSeconds}) {
              return {title, subtitle: `${startSeconds ?? 0}s`}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'chunks',
      title: 'Transcript chunks',
      description: 'The transcript in short timestamped pieces. The fallback for a moment.',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'videoChunk',
          title: 'Chunk',
          type: 'object',
          fields: [
            defineField({
              name: 'startSeconds',
              type: 'number',
              validation: (rule) => rule.required().integer().min(0),
            }),
            defineField({
              name: 'text',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'text', startSeconds: 'startSeconds'},
            prepare({title, startSeconds}) {
              return {title, subtitle: `${startSeconds ?? 0}s`}
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'id', chapters: 'chapters', chunks: 'chunks'},
    prepare({title, chapters, chunks}) {
      return {
        title,
        subtitle: `${chapters?.length ?? 0} chapters · ${chunks?.length ?? 0} chunks`,
      }
    },
  },
})
