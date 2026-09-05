/**
 * Project id and dataset are client-safe. The read token is NOT — it lives only
 * in `client.ts`, which is `server-only` (AGENTS §12).
 */
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-09-05'

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID',
)

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET',
)

function assertValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message)
  return value
}
