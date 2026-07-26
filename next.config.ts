import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Allow Next.js rewrites to reach local Valet HTTPS (self-signed certs) in dev.
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Dynamic Content-Security-Policy (nonce + allowlists): `src/proxy.ts` + `src/lib/csp-allowlist.ts`.

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // /tour-proxy is handled by app/tour-proxy/[[...path]]/route.ts so Authorization (Bearer)
  // is forwarded to Laravel. Plain rewrites do not pass the client Authorization header.
  async rewrites() {
    return [];
  },
  // Permanent redirect for old /ads/:uuid/:slug URLs → clean /ads/:slug
  async redirects() {
    return [
      {
        source: '/ads/:id/:slug',
        destination: '/ads/:slug',
        permanent: true,
      },
      // Slug typo fix — preserve link equity from the previously published URL
      {
        source: '/blog/eviter-arnaques-immobilieres-',
        destination: '/blog/eviter-arnaques-immobilieres',
        permanent: true,
      },
      // Legacy / mistaken asset path (returns a real image)
      {
        source: '/placeholder-house.jpg',
        destination: '/images/maison-blanche.webp',
        permanent: false,
      },
      // iOS Safari and crawlers look for these at the root regardless of <link> tags.
      {
        source: '/apple-touch-icon.png',
        destination: '/icons/icon-180x180.png',
        permanent: false,
      },
      {
        source: '/apple-touch-icon-precomposed.png',
        destination: '/icons/icon-180x180.png',
        permanent: false,
      },
    ];
  },
  experimental: {
    // Rewrite barrel imports to direct module paths for much smaller bundles.
    // Particularly important for @mui/icons-material which has 3 000+ icons.
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/lab',
    ],
    workerThreads: false,
    cpus: 1,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Tighter responsive sizes — avoids serving 1920-wide images for mobile cards.
    deviceSizes: [390, 640, 768, 1024, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
    // Cache optimized images for 7 days in the Next.js image cache (default is 60 s).
    // R2/CDN images are immutable — no need to re-process them on every request.
    minimumCacheTTL: 60 * 60 * 24 * 7,
    // Serve images inline (not as attachment) — required for browser img tag display.
    contentDispositionType: 'inline',
    // In dev, keyhome.test resolves to 127.0.0.1 which next/image blocks.
    // Skip optimization locally; production uses real domains and works fine.
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.keyhome.app',
      },
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
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
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
            value: 'camera=(), microphone=(self), geolocation=(self)',
          },
          // CSP is now set dynamically via src/proxy.ts with per-request nonces
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Service worker — never cache the SW file itself so updates propagate immediately
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      // Web App Manifests — short cache so icon/name updates reach users quickly
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8',
          },
        ],
      },
      {
        source: '/manifest-owner.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8',
          },
        ],
      },
      // Offline page — revalidated every request so it stays fresh
      {
        source: '/offline',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      // Digital Asset Links for TWA / Play Store
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
};

export default withSentryConfig(bundleAnalyzer(withNextIntl(nextConfig)), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'workgroup-h0',

  project: 'keyhome',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Disable source-map upload when SENTRY_AUTH_TOKEN is absent (e.g. Vercel
  // env var not yet set / token expired). Without this the build fails with
  // HTTP 401 and blocks every deploy. Set SENTRY_AUTH_TOKEN in the Vercel
  // project settings to re-enable uploads.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
