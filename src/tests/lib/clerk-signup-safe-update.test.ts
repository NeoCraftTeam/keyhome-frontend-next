import {
  buildClerkSignUpPatch,
  clerkMissingPhoneOnly,
} from '@/lib/clerk-signup-safe-update';
import { describe, expect, it } from 'vitest';

describe('buildClerkSignUpPatch', () => {
  it('sets legalAccepted when Clerk requires it', () => {
    const { patch } = buildClerkSignUpPatch(
      { missingFields: ['legal_accepted'] },
      { prefill: null }
    );
    expect(patch.legalAccepted).toBe(true);
  });

  it('detects phone-only missing fields', () => {
    expect(clerkMissingPhoneOnly(['phone_number'])).toBe(true);
    expect(clerkMissingPhoneOnly(['phone_number', 'last_name'])).toBe(false);
  });
});
