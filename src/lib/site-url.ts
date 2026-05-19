/**
 * Canonical public origin for SEO (metadata, sitemap, JSON-LD, OG URLs).
 *
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL  — must be set in Vercel Production env vars
 *  2. NEXT_PUBLIC_APP_URL   — alternative explicit override
 *  3. VERCEL_URL            — ONLY for preview/development (never production)
 *     because VERCEL_URL is a per-deployment hash URL that changes on every
 *     deploy and would poison canonical tags, sitemap and OG images in prod.
 *  4. Hardcoded fallback    — https://keyhome.app
 *
 * ⚠️  Set NEXT_PUBLIC_SITE_URL=https://keyhome.app in Vercel → Settings →
 *     Environment Variables (Production only) to lock in the canonical origin.
 */

export function getSiteOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    '';
  if (explicit !== '') {
    return explicit.replace(/\/+$/, '');
  }

  // Only use the Vercel deployment URL for non-production previews.
  // In production VERCEL_ENV === 'production', so this branch is skipped.
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== 'production') {
    const vercelRaw =
      process.env.VERCEL_URL?.trim() ||
      process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ||
      '';
    if (vercelRaw !== '') {
      const host = vercelRaw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
      return `https://${host}`;
    }
  }

  return 'https://keyhome.app';
}

export function absoluteUrl(path: string): string {
  const base = getSiteOrigin();
  if (path === '') {
    return base;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Resolves relative paths to absolute URLs for Open Graph / Twitter images. */
export function absoluteAssetUrl(url: string | undefined | null): string {
  const base = getSiteOrigin();
  if (url == null || url === '') {
    return `${base}/images/og-cover.png`;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}
