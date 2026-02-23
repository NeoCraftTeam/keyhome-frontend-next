import type { NextConfig } from 'next';

// Build CSP connect-src from environment — no hardcoded dev origins
const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const apiOrigin = apiUrl ? new URL(apiUrl).origin : '';
const clerkFrontendApiUrl = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')
  ? 'https://clerk.neocraft.dev'
  : 'https://*.clerk.accounts.dev';

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
  apiOrigin,
].filter(Boolean).join(' ');

const isDev = process.env.NODE_ENV === 'development';

const cspHeader = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://api.mapbox.com https://*.clerk.accounts.dev ${clerkFrontendApiUrl} https://*.clerk.com https://challenges.cloudflare.com blob:`,
  `style-src 'self' 'unsafe-inline' https://api.mapbox.com https://ray.st https://clerk.neocraft.dev`,
  `worker-src blob:`,
  `img-src 'self' blob: data: https://*.mapbox.com https://*.tiles.mapbox.com https://*.keyhome.cm https://*.keyhome.neocraft.dev https://keyhome.test https://img.clerk.com ${apiOrigin}`,
  `connect-src ${connectSources}`,
  `font-src 'self' https://fonts.gstatic.com https://ray.st https://clerk.neocraft.dev`,
  `frame-src https://*.clerk.accounts.dev https://clerk.neocraft.dev https://*.clerk.com https://challenges.cloudflare.com`,
  `frame-ancestors 'none'`,
].join('; ');

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.keyhome.cm',
      },
      {
        protocol: 'https',
        hostname: '**.keyhome.neocraft.dev',
      },
      {
        protocol: 'https',
        hostname: 'api.keyhome.neocraft.dev',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'keyhome.test',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
