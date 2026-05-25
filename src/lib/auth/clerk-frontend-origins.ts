/**
 * Clerk frontend script / connection origins for CSP and resource hints.
 *
 * Source of truth (in priority order):
 *  1. NEXT_PUBLIC_CLERK_DOMAIN env var (explicit override — set in Vercel per environment)
 *  2. Deployment URL hint (keyhome.app → clerk.keyhome.app, neocraft.dev → clerk.neocraft.dev)
 *
 * ⚠️  Do NOT derive the Clerk domain from the pk_live_ key prefix alone — different
 * production instances can use different custom FAPI domains.
 */

function resolveClerkHost(): string | null {
  const rawDomain = process.env.NEXT_PUBLIC_CLERK_DOMAIN?.trim();
  if (rawDomain) {
    const host = rawDomain
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      ?.replace(/\/$/, '');
    if (host) return host;
  }

  const deploymentHint =
    `${process.env.NEXT_PUBLIC_APP_URL ?? ''} ${process.env.VERCEL_URL ?? ''} ${process.env.NEXT_PUBLIC_VERCEL_URL ?? ''}`.toLowerCase();

  if (deploymentHint.includes('keyhome.app')) return 'clerk.keyhome.app';
  if (deploymentHint.includes('neocraft.dev')) return 'clerk.neocraft.dev';

  return null;
}

export function getClerkFrontendOrigins(): string[] {
  const origins = new Set<string>();
  const host = resolveClerkHost();
  if (host) {
    origins.add(`https://${host}`);
  }
  return Array.from(origins);
}

/**
 * Single origin for <link rel="preconnect"> — matches Clerk's actual FAPI host.
 */
export function getClerkPreconnectOrigin(): string | null {
  const host = resolveClerkHost();
  return host ? `https://${host}` : null;
}
