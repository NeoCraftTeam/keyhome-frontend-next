import { UserRole } from '@/types';

/** Roles allowed on the integrated Next.js owner panel (/owner/*). */
export const OWNER_PANEL_ROLES: readonly UserRole[] = [UserRole.AGENT];

export function mayAccessOwnerPanel(
  role: UserRole | string | undefined | null
): boolean {
  return role === UserRole.AGENT;
}
