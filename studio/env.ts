export const apiVersion = '2026-09-05'

export const projectId = assertValue(
  process.env.SANITY_STUDIO_PROJECT_ID,
  'Missing environment variable: SANITY_STUDIO_PROJECT_ID',
)

export const dataset = assertValue(
  process.env.SANITY_STUDIO_DATASET,
  'Missing environment variable: SANITY_STUDIO_DATASET',
)

function assertValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message)
  return value
}
