import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isReverbRealtimeConfigured,
  shouldUseBearerForBroadcastAuth,
} from '@/lib/chat/echo';

describe('isReverbRealtimeConfigured', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns false when key or host is empty after trim', () => {
    vi.stubEnv('NEXT_PUBLIC_REVERB_APP_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_REVERB_HOST', 'reverb.example.com');
    expect(isReverbRealtimeConfigured()).toBe(false);

    vi.stubEnv('NEXT_PUBLIC_REVERB_APP_KEY', 'k');
    vi.stubEnv('NEXT_PUBLIC_REVERB_HOST', '  ');
    expect(isReverbRealtimeConfigured()).toBe(false);
  });

  it('returns true when key and host are non-empty', () => {
    vi.stubEnv('NEXT_PUBLIC_REVERB_APP_KEY', 'app-key');
    vi.stubEnv('NEXT_PUBLIC_REVERB_HOST', 'reverb.example.com');
    expect(isReverbRealtimeConfigured()).toBe(true);
  });
});

describe('shouldUseBearerForBroadcastAuth', () => {
  it('returns false for null', () => {
    expect(shouldUseBearerForBroadcastAuth(null)).toBe(false);
  });

  it('returns false for Clerk-like JWT (3 base64url segments)', () => {
    expect(
      shouldUseBearerForBroadcastAuth(
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature'
      )
    ).toBe(false);
  });

  it('returns true for Sanctum personal access token shape', () => {
    expect(
      shouldUseBearerForBroadcastAuth(
        '550e8400-e29b-41d4-a716-446655440000|plaintextsecret'
      )
    ).toBe(true);
  });
});
