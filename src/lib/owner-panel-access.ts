import { UserRole } from '@/types';

import { AUTH_PANEL_UNAVAILABLE_MESSAGE } from '@/lib/auth-api-errors';

/** Roles allowed on the integrated Next.js owner panel (/owner/*). */
export const OWNER_PANEL_ROLES: readonly UserRole[] = [UserRole.AGENT];

/** @deprecated Use {@link AUTH_PANEL_UNAVAILABLE_MESSAGE} or {@link getAuthApiErrorMessage}. */
export const ADMIN_USE_ADMIN_PANEL_MESSAGE = AUTH_PANEL_UNAVAILABLE_MESSAGE;

export function mayAccessOwnerPanel(
  role: UserRole | string | undefined | null
): boolean {
  return role === UserRole.AGENT;
}
