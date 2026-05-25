import { describe, expect, it } from 'vitest';
import { shouldShowOwnerQuickCreateFab } from '@/lib/owner/owner-shell-fab';

describe('shouldShowOwnerQuickCreateFab', () => {
  it('returns false for null pathname', () => {
    expect(shouldShowOwnerQuickCreateFab(null)).toBe(false);
  });

  it('returns false for non-owner paths', () => {
    expect(shouldShowOwnerQuickCreateFab('/owner')).toBe(false);
    expect(shouldShowOwnerQuickCreateFab('/home')).toBe(false);
  });

  it('returns false on auth routes', () => {
    expect(shouldShowOwnerQuickCreateFab('/owner/login')).toBe(false);
    expect(shouldShowOwnerQuickCreateFab('/owner/register')).toBe(false);
    expect(shouldShowOwnerQuickCreateFab('/owner/forgot-password')).toBe(false);
  });

  it('returns true only on ads list', () => {
    expect(shouldShowOwnerQuickCreateFab('/owner/ads')).toBe(true);
  });

  it('returns false on new ad or ad detail', () => {
    expect(shouldShowOwnerQuickCreateFab('/owner/ads/new')).toBe(false);
    expect(
      shouldShowOwnerQuickCreateFab(
        '/owner/ads/550e8400-e29b-41d4-a716-446655440000'
      )
    ).toBe(false);
  });

  it('returns false on dashboard', () => {
    expect(shouldShowOwnerQuickCreateFab('/owner/dashboard')).toBe(false);
  });
});
