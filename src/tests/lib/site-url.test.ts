import { absoluteAssetUrl, absoluteUrl, getSiteOrigin } from '@/lib/site-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getSiteOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers NEXT_PUBLIC_SITE_URL and strips trailing slashes', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://staging.example.com/');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://ignored.test');
    expect(getSiteOrigin()).toBe('https://staging.example.com');
  });

  it('falls back to NEXT_PUBLIC_APP_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    expect(getSiteOrigin()).toBe('https://app.example.com');
  });

  it('uses VERCEL_URL when no explicit site URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_URL', 'my-app.vercel.app');
    expect(getSiteOrigin()).toBe('https://my-app.vercel.app');
  });

  it('defaults to keyhome.app', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_URL', '');
    expect(getSiteOrigin()).toBe('https://keyhome.app');
  });
});

describe('absoluteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefixes path with origin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com');
    expect(absoluteUrl('/search')).toBe('https://example.com/search');
  });
});

describe('absoluteAssetUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns remote URLs unchanged', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com');
    expect(absoluteAssetUrl('https://cdn.test/img.png')).toBe(
      'https://cdn.test/img.png'
    );
  });

  it('prefixes relative paths', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com');
    expect(absoluteAssetUrl('/images/x.png')).toBe(
      'https://example.com/images/x.png'
    );
  });

  it('uses default OG image when empty', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com');
    expect(absoluteAssetUrl(null)).toBe(
      'https://example.com/images/og-cover.png'
    );
  });
});
