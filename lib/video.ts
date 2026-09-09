/**
 * Video URL handling for the lesson embed.
 *
 * Only YouTube is supported: every seeded `videoUrl` is a YouTube watch URL, and
 * AGENTS §9 says a provider is not supported until both ingestion and playback
 * exist for it. Anything else returns `null` and the lesson renders its poster
 * without a play control rather than sending the learner off-site (AGENTS §7).
 */

/** `watch?v=ID`, `youtu.be/ID`, `/embed/ID` → `ID`. Anything else → `null`. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  // Exact host or a real subdomain of it — a bare `endsWith` would accept
  // notyoutube.com and hand an attacker-controlled host to the embed.
  const isHost = (domain: string) => host === domain || host.endsWith(`.${domain}`);
  const id =
    host === "youtu.be"
      ? parsed.pathname.slice(1)
      : isHost("youtube.com") || isHost("youtube-nocookie.com")
        ? (parsed.searchParams.get("v") ?? parsed.pathname.match(/^\/embed\/([^/]+)/)?.[1])
        : null;
  return id && /^[\w-]{6,20}$/.test(id) ? id : null;
}

/**
 * The privacy-mode embed, starting at `startSeconds` — the provider's own player.
 *
 * `enablejsapi=1` is what lets the lesson page attach the IFrame API and report watch
 * depth. It only opens the postMessage channel; the API script itself is loaded lazily,
 * after a play click.
 */
export function youtubeEmbedUrl(id: string, startSeconds = 0): string {
  const start = Number.isFinite(startSeconds) ? Math.max(0, Math.floor(startSeconds)) : 0;
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&enablejsapi=1${start ? `&start=${start}` : ""}`;
}

/** Reads the `?t=` start-seconds a search result links with (AGENTS §7/§11). */
export function startSecondsFrom(value: string | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
