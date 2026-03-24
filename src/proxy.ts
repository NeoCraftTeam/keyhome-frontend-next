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

  const isLiveClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_') ?? false;
  const clerkScriptHost = isLiveClerk ? 'https://clerk.neocraft.dev' : '';

  const isDev = process.env.NODE_ENV === 'development';

  const connectSources = [
    "'self'",
    'blob:',
    'data:',
    // Mapbox
    'https://api.mapbox.com',
    'https://events.mapbox.com',
    'https://*.tiles.mapbox.com',
    // Clerk
    'https://*.clerk.accounts.dev',
    clerkScriptHost,
    'https://*.clerk.com',
    'https://clerk.shared.global',
    'https://clerk-telemetry.com',
    // Cloudflare
    'https://challenges.cloudflare.com',
    // Analytics
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://*.googletagmanager.com',
    // Payments
    'https://api.flutterwave.com',
    // Storage
    'https://*.r2.dev',
    // App domains — catch-all for keyhome.app and neocraft.dev subdomains
    'https://*.keyhome.app',
    'https://*.neocraft.dev',
    apiOrigin,
    backendOrigin,
  ]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(' ');

  // Avoid 'strict-dynamic' in production: in CSP3 it disables host-based script-src
  // allowlists, which blocks Clerk's FAPI script (e.g. clerk.neocraft.dev) in Firefox
  // even when *.neocraft.dev is listed. Nonce still gates inline / hydration scripts.
  const scriptSrcEvalOrStrict = isDev ? "'unsafe-eval'" : '';

  const directives = [
    "default-src 'self'",
    // script-src: nonce + explicit third-party origins (Clerk live host when pk_live_)
    `script-src 'self' 'nonce-${nonce}'${scriptSrcEvalOrStrict ? ` ${scriptSrcEvalOrStrict}` : ''} https://api.mapbox.com https://*.clerk.accounts.dev${clerkScriptHost ? ` ${clerkScriptHost}` : ''} https://*.clerk.com https://challenges.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com https://vercel.live https://*.keyhome.app https://*.neocraft.dev blob:`,
    // style-src: unsafe-inline needed for MUI emotion; app domains added
    `style-src 'self' 'unsafe-inline' https://api.mapbox.com https://ray.st https://cdn.jsdelivr.net https://*.keyhome.app https://*.neocraft.dev`,
    `font-src 'self' https://fonts.gstatic.com https://ray.st https://*.keyhome.app https://*.neocraft.dev`,
    "worker-src 'self' blob:",
    `img-src 'self' blob: data: https://*.mapbox.com https://*.tiles.mapbox.com https://*.keyhome.app https://*.keyhome.cm https://*.neocraft.dev https://keyhome.test https://img.clerk.com https://*.r2.dev ${apiOrigin} ${backendOrigin}`,
    `connect-src ${connectSources}`,
    `frame-src https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://checkout.flutterwave.com https://vercel.live https://*.keyhome.app https://*.neocraft.dev`,
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
