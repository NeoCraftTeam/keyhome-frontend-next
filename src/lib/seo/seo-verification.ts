import type { Metadata } from 'next';

/**
 * Search engine site ownership verification (meta tags).
 * - Google Search Console: HTML tag method, paste token content only (not the full meta tag).
 * - Bing Webmaster Tools: Meta tag option → paste token for msvalidate.01.
 */
export function buildSiteVerification(): Metadata['verification'] | undefined {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || '';
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim() || '';

  const googleToken = google.length > 0 ? google : undefined;
  const bingToken = bing.length > 0 ? bing : undefined;

  if (!googleToken && !bingToken) {
    return undefined;
  }

  return {
    ...(googleToken ? { google: googleToken } : {}),
    ...(bingToken ? { other: { 'msvalidate.01': bingToken } } : {}),
  };
}
