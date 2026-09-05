import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Public-first (AGENTS §7): browsing the catalog, courses, lessons and instructors stays open.
 * Only per-learner surfaces are gated here — never in client code (AGENTS §12).
 */
const isProtectedRoute = createRouteMatcher(["/my-learning(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
