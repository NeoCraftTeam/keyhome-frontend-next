import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSiteVerification } from '@/lib/seo-verification';

describe('buildSiteVerification', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns undefined when no env is set', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION', '');
    vi.stubEnv('NEXT_PUBLIC_BING_SITE_VERIFICATION', '');
    expect(buildSiteVerification()).toBeUndefined();
  });

  it('includes google token when set', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION', '  abc-token  ');
    vi.stubEnv('NEXT_PUBLIC_BING_SITE_VERIFICATION', '');
    expect(buildSiteVerification()).toEqual({ google: 'abc-token' });
  });

  it('includes bing other meta when set', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION', '');
    vi.stubEnv('NEXT_PUBLIC_BING_SITE_VERIFICATION', 'bing-xyz');
    expect(buildSiteVerification()).toEqual({
      other: { 'msvalidate.01': 'bing-xyz' },
    });
  });

  it('merges google and bing when both set', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION', 'g1');
    vi.stubEnv('NEXT_PUBLIC_BING_SITE_VERIFICATION', 'b1');
    expect(buildSiteVerification()).toEqual({
      google: 'g1',
      other: { 'msvalidate.01': 'b1' },
    });
  });
});
