import { describe, expect, it } from 'vitest';

import { shouldUseBearerForBroadcastAuth } from '@/lib/echo';

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
