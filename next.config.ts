import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

// Build CSP connect-src from environment — no hardcoded dev origins
const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const apiOrigin = apiUrl ? new URL(apiUrl).origin : '';
// The Laravel backend may be served from a different subdomain (e.g. owner.keyhome.test).
// Tour image proxy URLs are generated from APP_URL, so we need that origin in the CSP too.
const ownerUrl = process.env.NEXT_PUBLIC_OWNER_URL || '';
const backendOrigin = ownerUrl ? new URL(ownerUrl).origin : apiOrigin;
const clerkFrontendApiUrl = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')
  ? 'https://clerk.neocraft.dev'
  : 'https://*.clerk.accounts.dev';

// In dev, allow both http and https for API/backend origins (e.g. keyhome.test may use either)
function originsWithAlternateProtocol(origin: string): string[] {
  if (!origin) return [];
  try {
    const url = new URL(origin);
    const alt = url.protocol === 'https:' ? `http://${url.host}` : `https://${url.host}`;
    return [origin, alt];
  } catch {
    return [origin];
  }
}

const devOrigins = process.env.NODE_ENV === 'development'
  ? [...originsWithAlternateProtocol(apiOrigin), ...originsWithAlternateProtocol(backendOrigin)]
  : [];

const connectSources = [
  "'self'",
  'https://api.mapbox.com',
  'https://events.mapbox.com',
  'https://*.tiles.mapbox.com',
  'https://*.clerk.accounts.dev',
  'https://clerk.neocraft.dev',
  'https://*.clerk.com',
  'https://clerk.shared.global',
  'https://clerk-telemetry.com',
  'https://challenges.cloudflare.com',
  // Google Analytics 4
  'https://www.google-analytics.com',
  'https://analytics.google.com',
  'https://*.googletagmanager.com',
  // Flutterwave
  'https://api.flutterwave.com',
  // Cloudflare R2 public CDN — Pannellum fetches panorama images via XHR (needs connect-src)
  'https://*.r2.dev',
  apiOrigin,
  // Laravel backend origin — tour image proxy URLs are generated from APP_URL (may differ from apiOrigin)
  backendOrigin,
  ...devOrigins,
].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' ');

const isDev = process.env.NODE_ENV === 'development';

const cspHeader = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://api.mapbox.com https://*.clerk.accounts.dev ${clerkFrontendApiUrl} https://*.clerk.com https://challenges.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com https://vercel.live https://cdn.jsdelivr.net blob:`,
  `style-src 'self' 'unsafe-inline' https://api.mapbox.com https://ray.st https://clerk.neocraft.dev https://cdn.jsdelivr.net`,
  `font-src 'self' https://fonts.gstatic.com https://ray.st https://clerk.neocraft.dev https://cdn.jsdelivr.net`,
  `worker-src 'self' blob:`,
  `img-src 'self' blob: data: https://*.mapbox.com https://*.tiles.mapbox.com https://*.keyhome.app https://*.keyhome.cm https://*.keyhome.neocraft.dev https://keyhome.test https://img.clerk.com https://*.r2.dev ${apiOrigin} ${backendOrigin}`,
  `connect-src ${connectSources}`,

  `frame-src https://*.clerk.accounts.dev https://clerk.neocraft.dev https://*.clerk.com https://challenges.cloudflare.com https://checkout.flutterwave.com https://vercel.live`,
  `frame-ancestors 'none'`,
].join('; ');

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // In dev, keyhome.test resolves to 127.0.0.1 which next/image blocks.
    // Skip optimization locally; production uses real domains and works fine.
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.keyhome.app",
      },
      {
        protocol: "https",
        hostname: "**.keyhome.cm",
      },
      {
        protocol: "https",
        hostname: "**.keyhome.neocraft.dev",
      },
      {
        protocol: "https",
        hostname: "api.keyhome.neocraft.dev",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "keyhome.test",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Service worker — never cache the SW file itself so updates propagate immediately
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      // Web App Manifest — short cache so icon/name updates reach users quickly
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600" },
          {
            key: "Content-Type",
            value: "application/manifest+json; charset=utf-8",
          },
        ],
      },
      // Offline page — revalidated every request so it stays fresh
      {
        source: "/offline",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      // Digital Asset Links for TWA / Play Store
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Only upload source maps when SENTRY_AUTH_TOKEN is set (CI/CD)
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Disable source map uploads unless auth token is present
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Tree-shake debug code in production (replaces deprecated disableLogger)
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});


