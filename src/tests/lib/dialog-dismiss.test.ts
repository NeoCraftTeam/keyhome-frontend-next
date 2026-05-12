import { isImplicitDialogDismissReason } from '@/lib/dialog-dismiss';
import { describe, expect, it } from 'vitest';

describe('isImplicitDialogDismissReason', () => {
  it('returns true for backdrop and escape', () => {
    expect(isImplicitDialogDismissReason('backdropClick')).toBe(true);
    expect(isImplicitDialogDismissReason('escapeKeyDown')).toBe(true);
  });

  it('returns false for explicit close / undefined', () => {
    expect(isImplicitDialogDismissReason(undefined)).toBe(false);
  });
});
