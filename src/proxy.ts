import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Clerk middleware — runs on every request but does NOT enforce Clerk sessions.
 * Route protection is handled client-side in (dashboard)/layout.tsx via useAuth(),
 * which supports both email/password users (Laravel Sanctum token) and OAuth users (Clerk).
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
