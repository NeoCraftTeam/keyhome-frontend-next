import type { Metadata, Viewport } from 'next';
import { brandAgent } from '@/theme/tokens';
import OwnerLayoutShell from './OwnerLayoutShell';

/**
 * Owner panel layout. Pinned as a server component so the per-route metadata
 * (manifest, theme-color, apple-web-app title) is emitted on the very first
 * HTML response — meaning Chrome detects the right manifest *before*
 * `beforeinstallprompt` fires, so the owner panel can be installed as its
 * own PWA without needing a client-side manifest swap to win the race.
 *
 * Runtime DOM swaps (`OwnerManifestSwitch`) still cover the soft-navigation
 * case (customer → owner via `<Link>`) because Next.js App Router does not
 * re-emit metadata on client navigation.
 */
export const metadata: Metadata = {
  manifest: '/manifest-owner.json',
  applicationName: 'KeyHome Propriétaire',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KH Propriétaire',
  },
  icons: {
    apple: [
      { url: '/images/logo-teal.png', sizes: '192x192' },
      { url: '/images/logo-teal.png', sizes: '512x512' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  /** Match root: no pinch-zoom in installed PWA / mobile shell. */
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: brandAgent.primary },
    { media: '(prefers-color-scheme: dark)', color: brandAgent.pwaChromeDark },
  ],
  viewportFit: 'cover',
  // Keyboard resize for Chromium is handled in root `ViewportInteractiveWidget`
  // (omitted here so Safari does not warn; this segment only overrides theme).
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerLayoutShell>{children}</OwnerLayoutShell>;
}
