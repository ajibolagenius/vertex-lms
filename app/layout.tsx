import { ClerkProvider } from "@clerk/nextjs";
import { PostHogIdentify } from "@/components/posthog-identify";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** Timestamps, durations and labels. See the type notes in globals.css. */
const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vertex",
  description: "AI-powered learning platform with intelligent content search.",
};

/**
 * Resolves the theme before the first paint, so a dark-mode learner never sees a
 * white flash. It runs ahead of React, which is why `<html>` suppresses the
 * hydration warning for the attribute it sets — and why globals.css has no
 * `prefers-color-scheme` block: this is the only place the OS setting is read.
 */
const THEME_SCRIPT = `try{var s=localStorage.getItem('vertex-theme');document.documentElement.setAttribute('data-theme',s==='light'||s==='dark'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <ClerkProvider>
          <PostHogIdentify />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
