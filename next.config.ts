import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sanity's asset CDN only — the dataset is private, but its assets are served from here.
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io", pathname: "/**" }],
  },
};

export default nextConfig;
