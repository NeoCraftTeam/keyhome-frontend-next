import { clerkMiddleware } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { getClerkFrontendOrigins } from '@/lib/clerk-frontend-origins';

const OWNER_PUBLIC_PATHS = [
  '/owner/login',
  '/owner/register',
  '/owner/forgot-password',
  '/owner/auth',
];

function isOwnerPublicPath(pathname: string): boolean {
  return OWNER_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isOwnerProtectedPath(pathname: string): boolean {
  return (
    (pathname === '/owner' || pathname.startsWith('/owner/')) &&
    !isOwnerPublicPath(pathname)
  );
}

/** Customer-only private pages — owners must not access these */
const CUSTOMER_PRIVATE_PATHS = ['/profile', '/my'];

function isCustomerPrivatePath(pathname: string): boolean {
  return CUSTOMER_PRIVATE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
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

  const clerkExplicitOrigins = getClerkFrontendOrigins();
  const clerkExplicitOriginsCsp = clerkExplicitOrigins.join(' ');

  const isDev = process.env.NODE_ENV === 'development';

  // Build Reverb WebSocket URL from env vars for CSP connect-src
  const reverbHost = process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost';
  const reverbPort = process.env.NEXT_PUBLIC_REVERB_PORT || '8080';
  // Include both ws:// and wss:// — Echo may use either depending on page protocol or forceTLS
  const reverbWsOrigin = `ws://${reverbHost}:${reverbPort}`;
  const reverbWssOrigin = `wss://${reverbHost}:${reverbPort}`;

  const connectSources = [
    "'self'",
    'blob:',
    'data:',
    // Laravel Reverb WebSocket (local dev + production)
    // In dev: bare ws:/wss: schemes allow all WS origins (env vars may not inline in Edge Runtime)
    ...(isDev ? ['ws:', 'wss:'] : []),
    reverbWsOrigin,
    reverbWssOrigin,
    'wss://*.keyhome.app',
    'wss://*.keyhome.neocraft.dev',
    'wss://*.neocraft.dev',
    // Mapbox
    'https://api.mapbox.com',
    'https://events.mapbox.com',
    'https://*.tiles.mapbox.com',
    // Clerk
    'https://*.clerk.accounts.dev',
    ...clerkExplicitOrigins,
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
    // Google One Tap — token exchange XHR
    'https://accounts.google.com',
    // Storage (R2 public bucket + signed URLs)
    'https://*.r2.dev',
    'https://*.r2.cloudflarestorage.com',
    // App domains
    // *.keyhome.app  covers api.keyhome.app, www.keyhome.app, etc. (one level)
    // *.keyhome.neocraft.dev covers api.keyhome.neocraft.dev, preview.keyhome.neocraft.dev, etc.
    // *.neocraft.dev only covers one level so api.keyhome.neocraft.dev needs the line above
    'https://*.keyhome.app',
    'https://*.keyhome.neocraft.dev',
    'https://*.neocraft.dev',
    'https://api.preview.neocraft.dev',
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
    // 'unsafe-inline' is intentionally omitted — nonce supersedes it.
    // Vercel injects _vercel/insights/script.js dynamically (no nonce); 'self' covers same-origin
    // scripts. va.vercel-scripts.com is Vercel Web Analytics CDN.
    `script-src 'self' 'unsafe-inline' 'nonce-${nonce}'${scriptSrcEvalOrStrict ? ` ${scriptSrcEvalOrStrict}` : ''} https://api.mapbox.com https://*.clerk.accounts.dev${clerkExplicitOriginsCsp ? ` ${clerkExplicitOriginsCsp}` : ''} https://*.clerk.com https://challenges.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com https://vercel.live https://accounts.google.com https://*.keyhome.app https://*.keyhome.neocraft.dev https://*.neocraft.dev blob:`,

    // style-src: 'unsafe-inline' only — no nonce.
    // CSP3 spec: when a nonce is present in style-src, 'unsafe-inline' is silently ignored,
    // which blocks all Emotion/MUI <style> tags that don't carry the nonce.
    // Since MUI injects many unnonce'd styles, we keep 'unsafe-inline' here without a nonce.
    // The nonce is only applied to script-src where it is effective and needed.
    `style-src 'self' 'unsafe-inline' https://api.mapbox.com https://ray.st https://cdn.jsdelivr.net https://accounts.google.com https://*.keyhome.app https://*.keyhome.neocraft.dev https://*.neocraft.dev`,
    `font-src 'self' https://fonts.gstatic.com https://ray.st https://*.keyhome.app https://*.keyhome.neocraft.dev https://*.neocraft.dev`,
    "worker-src 'self' blob:",
    `img-src 'self' blob: data: https://*.mapbox.com https://*.tiles.mapbox.com https://*.keyhome.app https://*.keyhome.cm https://*.keyhome.neocraft.dev https://*.neocraft.dev https://keyhome.test https://img.clerk.com https://*.r2.dev https://*.r2.cloudflarestorage.com https://lh3.googleusercontent.com ${apiOrigin} ${backendOrigin}`,

    `connect-src ${connectSources}`,
    `frame-src https://*.clerk.accounts.dev https://*.clerk.com${clerkExplicitOriginsCsp ? ` ${clerkExplicitOriginsCsp}` : ''} https://challenges.cloudflare.com https://checkout.flutterwave.com https://vercel.live https://accounts.google.com https://*.keyhome.app https://*.keyhome.neocraft.dev https://*.neocraft.dev`,
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
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image')
  ) {
    return false;
  }
  if (
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'
  ) {
    return false;
  }
  if (pathname.startsWith('/icons/')) {
    return false;
  }
  return true;
}

function isNextPrefetch(
  headers: Pick<NextRequest, 'headers'>['headers']
): boolean {
  return (
    headers.has('next-router-prefetch') || headers.get('purpose') === 'prefetch'
  );
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
export default clerkMiddleware(async (auth, req) => {
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

  // Customer-private pages: redirect authenticated owners back to their dashboard
  if (isCustomerPrivatePath(pathname)) {
    const role = req.cookies.get('kh_role')?.value;
    if (role === 'agent' || role === 'admin') {
      return NextResponse.redirect(new URL('/owner/dashboard', req.url));
    }
  }

  // Authenticated users on the landing page → redirect to dashboard
  if (userId && pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // Match old middleware: do not attach CSP / nonce for prefetch navigations
  if (isNextPrefetch(req.headers) && shouldApplyCsp(pathname)) {
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
