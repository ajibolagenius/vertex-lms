"use client";

import { useEffect } from "react";

/**
 * Registers the Vertex service worker for offline fallback and static asset caching.
 * Only registers in browser contexts supporting ServiceWorker on secure origins or localhost.
 */
export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      (window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.debug("PWA service worker registration notice:", err);
        });
      });
    }
  }, []);

  return null;
}
