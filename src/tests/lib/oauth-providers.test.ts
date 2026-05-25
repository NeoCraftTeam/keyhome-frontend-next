import { getConfiguredOAuthProviders } from '@/lib/auth/oauth-providers';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getConfiguredOAuthProviders', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('includes GitHub by default', () => {
    expect(getConfiguredOAuthProviders()).toEqual([
      'google',
      'facebook',
      'github',
    ]);
  });

  it('excludes GitHub when explicitly disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_GITHUB_ENABLED', 'false');
    expect(getConfiguredOAuthProviders()).toEqual(['google', 'facebook']);
  });
});
