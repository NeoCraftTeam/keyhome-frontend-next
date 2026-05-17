/**
 * Single source of truth for third-party Content-Security-Policy origins.
 *
 * Covers: local dev, *.keyhome.app, *.keyhome.cm, *.neocraft.dev, Firebase,
 * Vercel Analytics / Speed Insights, Microsoft Clarity, Sentry, Mapbox, Clerk, R2, Reverb.
 */

export type CspConnectBuildContext = {
  clerkOrigins: string[];
  apiOrigin: string;
  backendOrigin: string;
  isDev: boolean;
  reverbHost: string;
};

export function originsWithAlternateProtocol(origin: string): string[] {
  if (!origin) {
    return [];
  }
  try {
    const url = new URL(origin);
    const alt =
      url.protocol === 'https:' ? `http://${url.host}` : `https://${url.host}`;

    return [origin, alt];
  } catch {
    return [origin];
  }
}

function dedupe(parts: string[]): string[] {
  return [...new Set(parts.filter(Boolean))];
}

/**
 * Hosts for connect-src (fetch, XHR, WebSocket). Prefer stable patterns used by
 * our stacks (Firebase uses many *.googleapis.com / optional wss).
 */
export function buildConnectSrcParts(ctx: CspConnectBuildContext): string[] {
  const staticHosts: string[] = [
    "'self'",
    'blob:',
    'data:',
    // Mapbox
    'https://api.mapbox.com',
    'https://events.mapbox.com',
    'https://*.tiles.mapbox.com',
    // Clerk (extra origins from NEXT_PUBLIC_CLERK_DOMAIN / deployment hint)
    'https://*.clerk.accounts.dev',
    'https://*.clerk.com',
    'https://clerk.shared.global',
    'https://clerk-telemetry.com',
    // Cloudflare (Turnstile, Web Analytics beacon, etc.)
    'https://challenges.cloudflare.com',
    'https://cloudflareinsights.com',
    'https://*.cloudflareinsights.com',
    // Analytics
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://*.googletagmanager.com',
    // Google — OAuth One Tap, token endpoints
    'https://accounts.google.com',
    // Google Cloud / Firebase (Installations, FCM, Identity Toolkit, etc.)
    'https://*.googleapis.com',
    'wss://*.googleapis.com',
    'https://www.gstatic.com',
    // Payments
    'https://api.flutterwave.com',
    // Stripe — connect-src for the Stripe SDK + Elements analytics.
    // Iframe sources (`js.stripe.com`, `hooks.stripe.com`) are listed in
    // CSP_FRAME_HOSTS_STATIC below.
    'https://api.stripe.com',
    'https://maps.stripe.com',
    'https://merchant-ui-api.stripe.com',
    // R2 public + signed URLs
    'https://*.r2.dev',
    'https://*.r2.cloudflarestorage.com',
    // KeyHome / Neocraft deployments (~= every frontend/API host we ship)
    'https://*.keyhome.app',
    'https://*.keyhome.cm',
    'https://*.keyhome.neocraft.dev',
    'https://*.neocraft.dev',
    'https://api.preview.neocraft.dev',
    // Reverb on prod-like hosts
    'wss://*.keyhome.app',
    'wss://*.keyhome.neocraft.dev',
    // Vercel (@vercel/analytics, @vercel/speed-insights)
    'https://vitals.vercel-insights.com',
    'https://*.vercel-insights.com',
    // Microsoft Clarity (script + /collect + load-balanced subdomains; c.bing.com per MS CSP doc).
    // Both apex (www.clarity.ms) and subdomains (*.clarity.ms) must be listed —
    // the wildcard `*` does NOT cover the apex `www.clarity.ms` in CSP3.
    'https://www.clarity.ms',
    'https://*.clarity.ms',
    'https://c.bing.com',
    // Sentry browser SDK (@sentry/nextjs)
    'https://*.sentry.io',
    'https://*.ingest.sentry.io',
  ];

  const fromEnvReverb: string[] = [];
  if (ctx.reverbHost) {
    fromEnvReverb.push(`wss://${ctx.reverbHost}`, `ws://${ctx.reverbHost}`);
  }

  const devLocalReverb: string[] = ctx.isDev
    ? [
        'ws://localhost:8080',
        'http://localhost:8080',
        'ws://127.0.0.1:8080',
        'http://127.0.0.1:8080',
        'wss://localhost:8080',
      ]
    : [];

  const devAltApiBackend: string[] = ctx.isDev
    ? [
        ...originsWithAlternateProtocol(ctx.apiOrigin),
        ...originsWithAlternateProtocol(ctx.backendOrigin),
      ]
    : [];

  return dedupe([
    ...staticHosts,
    ...ctx.clerkOrigins,
    ctx.apiOrigin,
    ctx.backendOrigin,
    ...fromEnvReverb,
    ...devLocalReverb,
    ...devAltApiBackend,
  ]);
}

/** Extra script-src hosts (nonce + 'self' are added in proxy.ts). */
// Note: both apex (https://www.clarity.ms) AND wildcard (https://*.clarity.ms) are required
// for Clarity — the wildcard does not cover the apex domain in CSP3.
export const CSP_SCRIPT_HOSTS =
  'https://api.mapbox.com https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://static.cloudflareinsights.com https://www.googletagmanager.com https://va.vercel-scripts.com https://vercel.live https://accounts.google.com https://www.gstatic.com https://*.googleapis.com https://js.stripe.com https://www.clarity.ms https://*.clarity.ms https://*.keyhome.app https://*.keyhome.cm https://*.keyhome.neocraft.dev https://*.neocraft.dev blob:';

export const CSP_STYLE_HOSTS =
  'https://api.mapbox.com https://ray.st https://cdn.jsdelivr.net https://accounts.google.com https://www.gstatic.com https://*.keyhome.app https://*.keyhome.cm https://*.keyhome.neocraft.dev https://*.neocraft.dev';

export const CSP_FONT_HOSTS =
  'https://fonts.gstatic.com https://ray.st https://www.gstatic.com https://*.keyhome.app https://*.keyhome.cm https://*.keyhome.neocraft.dev https://*.neocraft.dev';

/** img-src: 'self' blob: data: + hosts + api/backend (runtime).
 *  GTM preview + measurement use image beacons to googletagmanager.com (/td, /a).
 */
export const CSP_IMG_HOSTS_STATIC =
  'https://*.mapbox.com https://*.tiles.mapbox.com https://*.keyhome.app https://*.keyhome.cm https://*.keyhome.neocraft.dev https://*.neocraft.dev https://keyhome.test https://img.clerk.com https://*.r2.dev https://*.r2.cloudflarestorage.com https://www.gstatic.com https://*.googleapis.com https://lh3.googleusercontent.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com';

/** media-src: audio/video (voice notes, attachments). Falls back to default-src if omitted. */
export const CSP_MEDIA_HOSTS_STATIC = CSP_IMG_HOSTS_STATIC;

export const CSP_FRAME_HOSTS_STATIC =
  'https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://checkout.flutterwave.com https://js.stripe.com https://hooks.stripe.com https://vercel.live https://accounts.google.com https://www.googletagmanager.com https://*.googletagmanager.com https://*.keyhome.app https://*.keyhome.cm https://*.keyhome.neocraft.dev https://*.neocraft.dev';
