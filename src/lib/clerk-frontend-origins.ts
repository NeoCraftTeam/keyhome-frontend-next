/**
 * Clerk frontend script / connection origins for CSP and resource hints.
 * Preview on *.neocraft.dev may use pk_test_* while assets still load from clerk.neocraft.dev.
 */
export function getClerkFrontendOrigins(): string[] {
  const origins = new Set<string>();

  const rawDomain = process.env.NEXT_PUBLIC_CLERK_DOMAIN?.trim();
  if (rawDomain) {
    const host = rawDomain
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      ?.replace(/\/$/, '');
    if (host) {
      origins.add(`https://${host}`);
    }
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
  if (publishableKey.startsWith('pk_live_')) {
    origins.add('https://clerk.neocraft.dev');
  }

  const deploymentHint = `${process.env.NEXT_PUBLIC_APP_URL ?? ''} ${process.env.VERCEL_URL ?? ''} ${process.env.NEXT_PUBLIC_VERCEL_URL ?? ''}`.toLowerCase();
  if (deploymentHint.includes('neocraft.dev')) {
    origins.add('https://clerk.neocraft.dev');
  }

  return Array.from(origins);
}

/**
 * Single origin for <link rel="preconnect"> — matches Clerk’s actual frontend when possible.
 */
export function getClerkPreconnectOrigin(): string | null {
  const rawDomain = process.env.NEXT_PUBLIC_CLERK_DOMAIN?.trim();
  if (rawDomain) {
    const host = rawDomain
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      ?.replace(/\/$/, '');
    if (host) {
      return `https://${host}`;
    }
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
  const deploymentHint = `${process.env.NEXT_PUBLIC_APP_URL ?? ''} ${process.env.VERCEL_URL ?? ''} ${process.env.NEXT_PUBLIC_VERCEL_URL ?? ''}`.toLowerCase();
  if (publishableKey.startsWith('pk_live_') || deploymentHint.includes('neocraft.dev')) {
    return 'https://clerk.neocraft.dev';
  }

  return null;
}
