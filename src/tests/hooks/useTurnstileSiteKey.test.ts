import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  API_URL: 'https://api.test',
}));

const DUMMY = '1x00000000000000000000AA';

describe('useTurnstileSiteKey', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { site_key: 'from-api-test-key' } }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('uses dummy site key on localhost without calling the API', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '0xPRODUCTION_SITE_KEY');
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hostname: 'localhost' },
    });

    const { useTurnstileSiteKey } = await import('@/hooks/useTurnstileSiteKey');
    const { result } = renderHook(() => useTurnstileSiteKey());

    await waitFor(() => expect(result.current.isResolved).toBe(true));

    expect(result.current.siteKey).toBe(DUMMY);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses NEXT_PUBLIC key on production hostname without fetching', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '0xPRODUCTION_SITE_KEY');
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hostname: 'keyhome.app' },
    });

    const { useTurnstileSiteKey } = await import('@/hooks/useTurnstileSiteKey');
    const { result } = renderHook(() => useTurnstileSiteKey());

    await waitFor(() => expect(result.current.isResolved).toBe(true));

    expect(result.current.siteKey).toBe('0xPRODUCTION_SITE_KEY');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches when no public key and host is not local-like', async () => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hostname: 'keyhome.app' },
    });

    const { useTurnstileSiteKey } = await import('@/hooks/useTurnstileSiteKey');
    const { result } = renderHook(() => useTurnstileSiteKey());

    await waitFor(() => expect(result.current.isResolved).toBe(true));

    expect(result.current.siteKey).toBe('from-api-test-key');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.test/config/turnstile',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
