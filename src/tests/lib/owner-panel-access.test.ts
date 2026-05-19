import {
  ADMIN_USE_ADMIN_PANEL_MESSAGE,
  mayAccessOwnerPanel,
} from '@/lib/owner-panel-access';
import { UserRole } from '@/types';
import { describe, expect, it } from 'vitest';

describe('owner-panel-access', () => {
  it('allows only agents on the owner panel', () => {
    expect(mayAccessOwnerPanel(UserRole.AGENT)).toBe(true);
    expect(mayAccessOwnerPanel(UserRole.ADMIN)).toBe(false);
    expect(mayAccessOwnerPanel(UserRole.CUSTOMER)).toBe(false);
  });

  it('exposes a generic panel denial message', () => {
    expect(ADMIN_USE_ADMIN_PANEL_MESSAGE).toBe(
      "Cette interface n'est pas disponible pour ce compte."
    );
    expect(ADMIN_USE_ADMIN_PANEL_MESSAGE).not.toMatch(/administrateur/i);
  });
});
