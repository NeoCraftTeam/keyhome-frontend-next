import { describe, expect, it } from 'vitest';

import {
  getOAuthCallbackUrl,
  getOAuthFallbackPath,
  getOAuthFallbackUrl,
  getOAuthSignInPath,
  getOAuthSignUpPath,
  oauthPanelContextFromIntent,
} from '@/lib/auth/oauth-redirect';

describe('oauth-redirect', () => {
  it('maps agent registration intent to owner panel', () => {
    expect(oauthPanelContextFromIntent('agent')).toBe('owner');
    expect(oauthPanelContextFromIntent('customer')).toBe('client');
  });

  it('returns owner-specific paths for owner panel', () => {
    expect(getOAuthSignInPath('owner')).toBe('/owner/login');
    expect(getOAuthSignUpPath('owner')).toBe('/register?role=agent');
    expect(getOAuthFallbackPath('owner')).toBe('/owner/dashboard');
  });

  it('returns client-specific paths for client panel', () => {
    expect(getOAuthSignInPath('client')).toBe('/login');
    expect(getOAuthSignUpPath('client')).toBe('/register');
    expect(getOAuthFallbackPath('client')).toBe('/home');
  });

  it('builds absolute callback and fallback URLs', () => {
    const origin = 'https://keyhome.app';
    expect(getOAuthCallbackUrl(origin)).toBe(
      'https://keyhome.app/sso-callback'
    );
    expect(getOAuthFallbackUrl(origin, 'owner')).toBe(
      'https://keyhome.app/owner/dashboard'
    );
    expect(getOAuthFallbackUrl(origin, 'client')).toBe(
      'https://keyhome.app/home'
    );
  });
});
