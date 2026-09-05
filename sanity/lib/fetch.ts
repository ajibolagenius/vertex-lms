import 'server-only'

import type {QueryParams} from 'next-sanity'

import {client, freshClient} from './client'

/**
 * `cacheComponents` is off in next.config.ts, so caching is per-fetch:
 * `next: { revalidate, tags }`. Keeping `QueryString` as a literal type preserves
 * TypeGen's `client.fetch` overload, so callers get a typed result for free.
 */
export async function sanityFetch<const QueryString extends string>({
  query,
  params = {},
  revalidate = 60,
  tags = [],
  fresh = false,
}: {
  query: QueryString
  params?: QueryParams
  /** Seconds. `false` caches until a tag invalidates it. */
  revalidate?: number | false
  tags?: string[]
  /** Bypass the Sanity CDN. Use in `generateStaticParams`. */
  fresh?: boolean
}) {
  return (fresh ? freshClient : client).fetch(query, params, {
    next: {
      // A tagged query is invalidated by its tag, not by a timer.
      revalidate: tags.length ? false : revalidate,
      tags,
    },
  })
}
