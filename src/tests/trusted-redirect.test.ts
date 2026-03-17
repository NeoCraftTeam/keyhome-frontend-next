import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We need to re-import the module for each test group to control NODE_ENV
let isTrustedRedirectUrl: typeof import('@/lib/trusted-redirect').isTrustedRedirectUrl;
let redirectToTrustedUrl: typeof import('@/lib/trusted-redirect').redirectToTrustedUrl;

// Store original window.location to restore after tests
const originalLocation = window.location;

function mockWindowLocation(origin: string = 'https://keyhome.app') {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      origin,
      assign: vi.fn(),
      href: `${origin}/`,
    },
  });
}

beforeEach(async () => {
  vi.resetModules();
  mockWindowLocation('https://keyhome.app');
  const mod = await import('@/lib/trusted-redirect');
  isTrustedRedirectUrl = mod.isTrustedRedirectUrl;
  redirectToTrustedUrl = mod.redirectToTrustedUrl;
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: originalLocation,
  });
});

describe('isTrustedRedirectUrl', () => {
  describe('same-origin URLs', () => {
    // BUG CATCH: Relative URLs like "/dashboard" must be allowed,
    // otherwise internal navigation after login/payment breaks.
    it('allows relative paths (same origin)', () => {
      expect(isTrustedRedirectUrl('/dashboard')).toBe(true);
    });

    // BUG CATCH: Full same-origin URLs must also work.
    it('allows full same-origin URLs', () => {
      expect(isTrustedRedirectUrl('https://keyhome.app/ads/123')).toBe(true);
    });

    it('allows same-origin with query params', () => {
      expect(isTrustedRedirectUrl('/search?city=Yaounde&type=rent')).toBe(true);
    });
  });

  describe('trusted external hosts', () => {
    // BUG CATCH: After Clerk or Flutterwave OAuth flows, the app needs to
    // redirect to these external services. Blocking them breaks auth/payments.
    it('allows keyhome.app', () => {
      expect(isTrustedRedirectUrl('https://keyhome.app/callback')).toBe(true);
    });

    it('allows keyhome.cm', () => {
      expect(isTrustedRedirectUrl('https://keyhome.cm/ads')).toBe(true);
    });

    it('allows keyhome.neocraft.dev', () => {
      expect(isTrustedRedirectUrl('https://keyhome.neocraft.dev')).toBe(true);
    });

    it('allows clerk.com', () => {
      expect(isTrustedRedirectUrl('https://clerk.com/sso')).toBe(true);
    });

    it('allows flutterwave.com', () => {
      expect(isTrustedRedirectUrl('https://flutterwave.com/pay/abc123')).toBe(true);
    });

    // BUG CATCH: Subdomains of trusted hosts must be allowed, e.g.
    // accounts.clerk.com used during SSO flows.
    it('allows subdomains of trusted hosts', () => {
      expect(isTrustedRedirectUrl('https://accounts.clerk.com/sign-in')).toBe(true);
    });

    it('allows deep subdomains of trusted hosts', () => {
      expect(isTrustedRedirectUrl('https://checkout.flutterwave.com/pay/123')).toBe(true);
    });

    it('allows dev-flutterwave.com sandbox checkout', () => {
      expect(isTrustedRedirectUrl('https://checkout-v2.dev-flutterwave.com/v3/hosted/pay/abc123')).toBe(true);
    });
  });

  describe('security — blocked URLs', () => {
    // BUG CATCH: javascript: URLs are classic XSS attack vectors.
    // If allowed, an attacker could inject `javascript:alert(document.cookie)`
    // to steal session tokens.
    it('rejects javascript: protocol URLs', () => {
      expect(isTrustedRedirectUrl('javascript:alert(1)')).toBe(false);
    });

    // BUG CATCH: Open redirect vulnerability — an attacker could craft
    // a URL like evil.com to phish credentials by mimicking the login page.
    it('rejects untrusted external HTTPS hosts', () => {
      expect(isTrustedRedirectUrl('https://evil.com/steal-tokens')).toBe(false);
    });

    it('rejects untrusted HTTP hosts in production', () => {
      expect(isTrustedRedirectUrl('http://attacker.com/phish')).toBe(false);
    });

    // BUG CATCH: data: URLs can execute arbitrary code (data:text/html,<script>...)
    it('rejects data: protocol URLs', () => {
      expect(isTrustedRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    // BUG CATCH: Hostnames that look similar but aren't subdomains should be blocked.
    // e.g., "notkeyhome.app" should NOT match "keyhome.app".
    it('rejects hosts that look like trusted hosts but are not subdomains', () => {
      expect(isTrustedRedirectUrl('https://notkeyhome.app/dashboard')).toBe(false);
    });

    it('rejects hosts that end with trusted host name but are different domains', () => {
      expect(isTrustedRedirectUrl('https://fakekeyhome.app/admin')).toBe(false);
    });

    // BUG CATCH: FTP and other non-HTTP protocols must be blocked.
    it('rejects ftp: protocol', () => {
      expect(isTrustedRedirectUrl('ftp://files.keyhome.app/secret')).toBe(false);
    });
  });

  describe('edge cases', () => {
    // BUG CATCH: If empty string isn't handled, URL parsing could throw
    // and crash the redirect flow.
    it('returns false for empty string', () => {
      expect(isTrustedRedirectUrl('')).toBe(false);
    });

    // BUG CATCH: Malformed URLs must not crash the app.
    it('returns false for malformed URLs', () => {
      expect(isTrustedRedirectUrl('not-a-url-at-all::://')).toBe(false);
    });

    // NOTE: Whitespace-only URLs are parsed by `new URL()` as relative paths,
    // resolving to same-origin. This is correct browser behavior.
    it('treats whitespace-only string as relative (same-origin)', () => {
      expect(isTrustedRedirectUrl('   ')).toBe(true);
    });

    // BUG CATCH: URL with special characters in path should still work
    // if the host is trusted.
    it('allows trusted host with unicode in path', () => {
      expect(isTrustedRedirectUrl('https://keyhome.app/recherche/Yaoundé')).toBe(true);
    });
  });

  describe('HTTP in development mode', () => {
    // BUG CATCH: Developers must be able to test redirects to local services.
    // If localhost HTTP is blocked in dev, the development workflow breaks.
    it('allows http://localhost in development', async () => {
      vi.resetModules();
      vi.stubEnv('NODE_ENV', 'development');
      try {
        mockWindowLocation('http://localhost:3000');

        const mod = await import('@/lib/trusted-redirect');
        expect(mod.isTrustedRedirectUrl('http://localhost:8000/api')).toBe(true);
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it('allows http://127.0.0.1 in development', async () => {
      vi.resetModules();
      vi.stubEnv('NODE_ENV', 'development');
      try {
        mockWindowLocation('http://localhost:3000');

        const mod = await import('@/lib/trusted-redirect');
        expect(mod.isTrustedRedirectUrl('http://127.0.0.1:8000/api')).toBe(true);
      } finally {
        vi.unstubAllEnvs();
      }
    });
  });
});

describe('redirectToTrustedUrl', () => {
  // BUG CATCH: If redirect doesn't call window.location.assign,
  // the user stays on the same page after payment/auth completion.
  it('calls window.location.assign for trusted URLs and returns true', () => {
    const result = redirectToTrustedUrl('/dashboard');
    expect(result).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith('/dashboard');
  });

  // BUG CATCH: If redirect allows untrusted URLs, attackers can redirect
  // users to phishing sites via crafted links.
  it('does NOT call window.location.assign for untrusted URLs and returns false', () => {
    const result = redirectToTrustedUrl('https://evil.com');
    expect(result).toBe(false);
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it('returns false for empty URL', () => {
    const result = redirectToTrustedUrl('');
    expect(result).toBe(false);
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
