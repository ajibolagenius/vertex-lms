import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sanity's asset CDN only — the dataset is private, but its assets are served from here.
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io", pathname: "/**" }],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
