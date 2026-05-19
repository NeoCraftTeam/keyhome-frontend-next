import { UserRole } from '@/types';

/** Roles allowed on the integrated Next.js owner panel (/owner/*). */
export const OWNER_PANEL_ROLES: readonly UserRole[] = [UserRole.AGENT];

export const ADMIN_USE_ADMIN_PANEL_MESSAGE =
  'Utilisez le panneau administrateur.';

export function mayAccessOwnerPanel(
  role: UserRole | string | undefined | null
): boolean {
  return role === UserRole.AGENT;
}
