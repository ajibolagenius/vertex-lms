import 'server-only'

import dns from 'node:dns'
import type {QueryParams} from 'next-sanity'

import {client, freshClient} from './client'

try {
  dns.setDefaultResultOrder('ipv4first')
  const origLookup = dns.lookup
  const resolver = new dns.promises.Resolver()
  resolver.setServers(['8.8.8.8', '1.1.1.1'])
  const cache = new Map<string, string[]>()

  type LookupCallback = (err: NodeJS.ErrnoException | null, address?: unknown, family?: unknown) => void

  // @ts-expect-error - overriding lookup for fallback resilience
  dns.lookup = function (
    hostname: string,
    options: dns.LookupOptions | number | null | undefined | LookupCallback,
    callback?: LookupCallback
  ) {
    let cb = callback
    let opts = options
    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    }
    const resolvedCb = cb ?? (() => {})
    // @ts-expect-error - runtime overload passthrough
    origLookup(hostname, opts, async (err: NodeJS.ErrnoException | null, address: unknown, family: unknown) => {
      if (err && (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' || err.code === 'SERVFAIL')) {
        try {
          let addresses = cache.get(hostname)
          if (!addresses) {
            addresses = await resolver.resolve4(hostname)
            if (addresses && addresses.length > 0) {
              cache.set(hostname, addresses)
            }
          }
          if (addresses && addresses.length > 0) {
            if (opts && typeof opts === 'object' && 'all' in opts && opts.all) {
              return resolvedCb(null, addresses.map((a) => ({ address: a, family: 4 })))
            }
            return resolvedCb(null, addresses[0], 4)
          }
        } catch {
          return resolvedCb(err)
        }
      }
      return resolvedCb(err, address, family)
    })
  }
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

