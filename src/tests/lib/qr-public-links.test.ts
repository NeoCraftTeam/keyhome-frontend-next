import {
  absoluteAdUrl,
  absoluteLandlordUrl,
  adPublicPath,
  landlordPublicPath,
} from '@/lib/qr-public-links';
import { describe, expect, it, vi } from 'vitest';

describe('qr-public-links', () => {
  it('builds ad and landlord paths', () => {
    expect(adPublicPath('studio-dla-123')).toBe('/ads/studio-dla-123');
    expect(landlordPublicPath('  jean_dupont  ')).toBe(
      '/bailleurs/jean_dupont'
    );
  });

  it('prefixes absolute URLs from site origin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test');
    expect(absoluteAdUrl('x')).toBe('https://example.test/ads/x');
    expect(absoluteLandlordUrl('u')).toBe('https://example.test/bailleurs/u');
    vi.unstubAllEnvs();
  });
});
