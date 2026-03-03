import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Clerk proxy — runs on every request.
 *
 * SEO-critical: redirects authenticated users away from the landing page
 * at the edge so the landing page always SSR-renders for Googlebot.
 *
 * Route protection for dashboard pages is handled client-side in
 * (dashboard)/layout.tsx via useAuth(), which supports both
 * email/password users (Laravel Sanctum) and OAuth users (Clerk).
 */
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Authenticated users on the landing page → redirect to dashboard
  if (userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
