import 'server-only'

import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from './env'

const token = process.env.SANITY_API_READ_TOKEN

if (!token) {
  throw new Error(
    'Missing environment variable: SANITY_API_READ_TOKEN. The dataset is private, so ' +
      'reads need a Viewer token. It is server-only — never prefix it with NEXT_PUBLIC_.',
  )
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: true,
  // Drafts must never reach a visitor.
  perspective: 'published',
})

/** Same client, straight off the API. For `generateStaticParams`, where a stale
 *  CDN read silently drops routes. */
export const freshClient = client.withConfig({useCdn: false})
