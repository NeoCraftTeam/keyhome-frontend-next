import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const OWNER_PUBLIC_PATHS = ['/owner/login', '/owner/register', '/owner/forgot-password'];

function isOwnerPublicPath(pathname: string): boolean {
  return OWNER_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isOwnerProtectedPath(pathname: string): boolean {
  return (pathname === '/owner' || pathname.startsWith('/owner/')) && !isOwnerPublicPath(pathname);
}

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
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // Owner panel edge guard: block customers and unauthenticated users
  if (isOwnerProtectedPath(pathname)) {
    const role = req.cookies.get('kh_role')?.value;
    if (!role) {
      return NextResponse.redirect(new URL('/owner/login', req.url));
    }
    if (role === 'customer') {
      return NextResponse.redirect(new URL('/home', req.url));
    }
  }

  // Authenticated users on the landing page → redirect to dashboard
  if (userId && pathname === '/') {
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
