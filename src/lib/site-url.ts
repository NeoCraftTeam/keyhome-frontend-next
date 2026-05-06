/**
 * Canonical public origin for SEO (metadata, sitemap, JSON-LD, OG URLs).
 *
 * Set `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_APP_URL` in each environment
 * (e.g. https://keyhome.app, https://preprod.keyhome.app).
 */

export function getSiteOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    '';
  if (explicit !== '') {
    return explicit.replace(/\/+$/, '');
  }

  const vercelRaw =
    process.env.VERCEL_URL?.trim() ||
    process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ||
    '';
  if (vercelRaw !== '') {
    const host = vercelRaw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `https://${host}`;
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
