import { ClerkProvider } from "@clerk/nextjs";
import { PostHogIdentify } from "@/components/posthog-identify";
import { PwaRegister } from "@/components/pwa-register";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Orbitron, Space_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** Timestamps, durations and labels. See the type notes in globals.css. */
const mono = Space_Mono({
  variable: "--font-mono-face",
  weight: ["400", "700"],
  subsets: ["latin"],
});

/**
 * The display face, and deliberately rationed: the wordmark and the page hero only.
 * Orbitron is a costume at paragraph length — Inter still carries every heading.
 */
const display = Orbitron({
  variable: "--font-display-face",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0C0E" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Vertex",
    template: "%s — Vertex",
  },
  description: "AI-powered learning platform with intelligent content search.",
  applicationName: "Vertex",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vertex",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

/**
 * Resolves the theme before the first paint, so a dark-mode learner never sees a
 * white flash. It is injected into the initial HTML and runs ahead of any Next.js
 * module (`beforeInteractive`, which the docs require to live in the root layout),
 * which is why `<html>` suppresses the hydration warning for the attribute it sets —
 * and why globals.css has no `prefers-color-scheme` block: this is the only place the
 * OS setting is read.
 */
const THEME_SCRIPT = `try{var s=localStorage.getItem('vertex-theme');document.documentElement.setAttribute('data-theme',s==='light'||s==='dark'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="vertex-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
        <ClerkProvider>
          <PostHogIdentify />
          <PwaRegister />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
