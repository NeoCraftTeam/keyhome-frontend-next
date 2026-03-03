import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

/**
 * Public layout for ad detail pages.
 * This is intentionally outside the (dashboard) group so that
 * Googlebot can crawl and index ad pages without authentication.
 */
export default function AdsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

