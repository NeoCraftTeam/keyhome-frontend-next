import { getConfiguredOAuthProviders } from '@/lib/oauth-providers';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getConfiguredOAuthProviders', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('excludes GitHub by default', () => {
    expect(getConfiguredOAuthProviders()).toEqual(['google', 'facebook']);
  });

  it('includes GitHub when env is true', () => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_GITHUB_ENABLED', 'true');
    expect(getConfiguredOAuthProviders()).toEqual([
      'google',
      'facebook',
      'github',
    ]);
  });
});
