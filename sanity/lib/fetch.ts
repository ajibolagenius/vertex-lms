import 'server-only'

import dns from 'node:dns'
import type {QueryParams} from 'next-sanity'

import {client, freshClient} from './client'

try {
  dns.setDefaultResultOrder('ipv4first')
} catch {
  // Non-fatal if not supported
}

/**
 * `cacheComponents` is off in next.config.ts, so caching is per-fetch:
 * `next: { revalidate, tags }`. Keeping `QueryString` as a literal type preserves
 * TypeGen's `client.fetch` overload, so callers get a typed result for free.
 *
 * Includes retry backoff to survive transient DNS/network hiccups during parallel build worker floods.
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
  const targetClient = fresh ? freshClient : client
  let lastError: unknown

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await targetClient.fetch(query, params, {
        next: {
          // A tagged query is invalidated by its tag, not by a timer.
          revalidate: tags.length ? false : revalidate,
          tags,
        },
      })
    } catch (err) {
      lastError = err
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
      }
    }
  }

  throw lastError
}

