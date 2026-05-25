import { AUTH_PANEL_UNAVAILABLE_MESSAGE } from '@/lib/auth/auth-api-errors';
import { mayAccessOwnerPanel } from '@/lib/owner/owner-panel-access';
import { UserRole } from '@/types';
import { describe, expect, it } from 'vitest';

describe('owner-panel-access', () => {
  it('allows only agents on the owner panel', () => {
    expect(mayAccessOwnerPanel(UserRole.AGENT)).toBe(true);
    expect(mayAccessOwnerPanel(UserRole.ADMIN)).toBe(false);
    expect(mayAccessOwnerPanel(UserRole.CUSTOMER)).toBe(false);
  });

  it('exposes a generic panel denial message', () => {
    expect(AUTH_PANEL_UNAVAILABLE_MESSAGE).toBe(
      "Cette interface n'est pas disponible pour ce compte."
    );
    expect(AUTH_PANEL_UNAVAILABLE_MESSAGE).not.toMatch(/administrateur/i);
  });
});
