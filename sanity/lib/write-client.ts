import 'server-only'

import {createClient, type SanityClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from './env'

let cached: SanityClient | null = null

/**
 * The only client in the app that can write. Used by `app/api/progress/route.ts` and
 * nothing else: content is authored in the Studio, and the browser never writes at all.
 *
 * Built on first use rather than at import, so a deployment without the token fails the
 * one request that needs it instead of the whole build.
 */
export function getWriteClient(): SanityClient {
  if (cached) return cached

  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) {
    throw new Error(
      'Missing environment variable: SANITY_API_WRITE_TOKEN. Learner progress is written from ' +
        'the server only (AGENTS §12) — never prefix it with NEXT_PUBLIC_.',
    )
  }

  cached = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: 'published',
  })
  return cached
}
