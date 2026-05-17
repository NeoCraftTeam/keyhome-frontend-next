import {
  getGoogleMarketingIds,
  sanitizeGtmContainerId,
} from '@/lib/analytics/google-marketing-env';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sanitizeGtmContainerId', () => {
  it('accepts a valid container id', () => {
    expect(sanitizeGtmContainerId('GTM-ABC123')).toBe('GTM-ABC123');
  });

  it('returns undefined for invalid or script-injection payloads', () => {
    expect(sanitizeGtmContainerId("GTM-X');alert(1)//")).toBeUndefined();
    expect(sanitizeGtmContainerId('gtm-lowercase')).toBeUndefined();
    expect(sanitizeGtmContainerId('')).toBeUndefined();
    expect(sanitizeGtmContainerId(undefined)).toBeUndefined();
  });
});

describe('getGoogleMarketingIds', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exposes sanitized gtm id when env matches pattern', () => {
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-TEST01');
    const { gtmId } = getGoogleMarketingIds();
    expect(gtmId).toBe('GTM-TEST01');
  });

  it('drops malformed gtm id from env', () => {
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'evil');
    const { gtmId } = getGoogleMarketingIds();
    expect(gtmId).toBeUndefined();
  });
});
