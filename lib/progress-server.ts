import "server-only";

import { PROGRESS_BY_USER_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/fetch";

/**
 * One learner's progress records. Per-learner data, so it bypasses both caches: a shared
 * 60s fetch entry would be wrong, and a CDN read would not show the learner their own write.
 *
 * `userId` always comes from Clerk's `auth()` on the server, never from a request.
 */
export function readProgress(userId: string) {
  return sanityFetch({
    query: PROGRESS_BY_USER_QUERY,
    params: { userId },
    fresh: true,
    revalidate: 0,
  });
}
