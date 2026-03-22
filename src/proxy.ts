import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const OWNER_PUBLIC_PATHS = ['/owner/login', '/owner/register', '/owner/forgot-password'];

function isOwnerPublicPath(pathname: string): boolean {
  return OWNER_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isOwnerProtectedPath(pathname: string): boolean {
  return (pathname === '/owner' || pathname.startsWith('/owner/')) && !isOwnerPublicPath(pathname);
}

/**
 * Build the Content-Security-Policy header with a per-request nonce.
 *
 * The nonce allows Next.js hydration scripts and MUI emotion style tags
 * to run without needing 'unsafe-inline'. Third-party domains are
 * kept in sync with the static CSP in next.config.ts (which no longer
 * includes the CSP header itself).
 */
function buildCsp(nonce: string): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  let apiOrigin = '';
  try {
    apiOrigin = apiUrl ? new URL(apiUrl).origin : '';
  } catch {
    apiOrigin = '';
  }

  const ownerUrl = process.env.NEXT_PUBLIC_OWNER_URL || '';
  let backendOrigin = '';
  try {
    backendOrigin = ownerUrl ? new URL(ownerUrl).origin : apiOrigin;
  } catch {
    backendOrigin = apiOrigin;
  }

  const clerkFrontendApiUrl = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')
    ? 'https://clerk.neocraft.dev'
    : 'https://*.clerk.accounts.dev';

  const isDev = process.env.NODE_ENV === 'development';

  const connectSources = [
    "'self'",
    'blob:',
    'data:',
    'https://api.mapbox.com',
    'https://events.mapbox.com',
    'https://*.tiles.mapbox.com',
    'https://*.clerk.accounts.dev',
    'https://clerk.neocraft.dev',
    'https://*.clerk.com',
    'https://clerk.shared.global',
    'https://clerk-telemetry.com',
    'https://challenges.cloudflare.com',
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://*.googletagmanager.com',
    'https://api.flutterwave.com',
    'https://*.r2.dev',
    apiOrigin,
    backendOrigin,
  ]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(' ');

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : "'strict-dynamic'"} https://api.mapbox.com https://*.clerk.accounts.dev ${clerkFrontendApiUrl} https://*.clerk.com https://challenges.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com https://vercel.live blob:`,
    `style-src 'self' 'unsafe-inline' https://api.mapbox.com https://ray.st https://clerk.neocraft.dev https://cdn.jsdelivr.net`,
    "font-src 'self' https://fonts.gstatic.com https://ray.st https://clerk.neocraft.dev",
    "worker-src 'self' blob:",
    `img-src 'self' blob: data: https://*.mapbox.com https://*.tiles.mapbox.com https://*.keyhome.app https://*.keyhome.cm https://*.keyhome.neocraft.dev https://keyhome.test https://img.clerk.com https://*.r2.dev ${apiOrigin} ${backendOrigin}`,
    `connect-src ${connectSources}`,
    `frame-src https://*.clerk.accounts.dev https://clerk.neocraft.dev https://*.clerk.com https://challenges.cloudflare.com https://checkout.flutterwave.com https://vercel.live`,
    "frame-ancestors 'none'",
  ];

  return directives.join('; ');
}

/** Same exclusions as the former middleware.ts matcher (no CSP on these paths). */
function shouldApplyCsp(pathname: string): boolean {
  if (pathname.startsWith('/api')) {
    return false;
  }
  if (pathname.startsWith('/trpc')) {
    return false;
  }
  if (pathname.startsWith('/_next/static') || pathname.startsWith('/_next/image')) {
    return false;
  }
  if (pathname === '/favicon.ico' || pathname === '/manifest.json' || pathname === '/sw.js') {
    return false;
  }
  if (pathname.startsWith('/icons/')) {
    return false;
  }
  return true;
}

function isNextPrefetch(req: NextRequest): boolean {
  return req.headers.has('next-router-prefetch') || req.headers.get('purpose') === 'prefetch';
}

/**
 * Clerk proxy — runs on every matched request (Next.js 16+ uses `proxy.ts` only; `middleware.ts` is deprecated).
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

  // Match old middleware: do not attach CSP / nonce for prefetch navigations
  if (isNextPrefetch(req) && shouldApplyCsp(pathname)) {
    return NextResponse.next();
  }

  if (!shouldApplyCsp(pathname)) {
    return NextResponse.next();
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files; Clerk + CSP run in the callback (CSP skipped for /api, /trpc, prefetch — see above)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
