'use client';

const DEFAULT_TRUSTED_HOSTS = [
  'keyhome.app',
  'keyhome.cm',
  'keyhome.neocraft.dev',
  'clerk.accounts.dev',
  'clerk.com',
  'clerk.neocraft.dev',
  'clerk.shared.global',
  'fedapay.com',
];

function getConfiguredTrustedHosts(): string[] {
  const raw = process.env.NEXT_PUBLIC_TRUSTED_REDIRECT_HOSTS ?? '';
  if (!raw.trim()) {
    return [];
  }

  return raw
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  const trustedHosts = [...DEFAULT_TRUSTED_HOSTS, ...getConfiguredTrustedHosts()];

  return trustedHosts.some((trustedHost) =>
    normalizedHost === trustedHost || normalizedHost.endsWith(`.${trustedHost}`)
  );
}

export function isTrustedRedirectUrl(rawUrl: string): boolean {
  if (!rawUrl) {
    return false;
  }

  try {
    const parsed = new URL(rawUrl, window.location.origin);
    const isSameOrigin = parsed.origin === window.location.origin;

    if (isSameOrigin) {
      return true;
    }

    if (parsed.protocol === 'https:') {
      return isAllowedHost(parsed.hostname);
    }

    if (parsed.protocol === 'http:') {
      const isDev = process.env.NODE_ENV === 'development';
      return isDev && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
    }

    return false;
  } catch {
    return false;
  }
}

export function redirectToTrustedUrl(rawUrl: string): boolean {
  if (!isTrustedRedirectUrl(rawUrl)) {
    return false;
  }

  window.location.assign(rawUrl);
  return true;
}
