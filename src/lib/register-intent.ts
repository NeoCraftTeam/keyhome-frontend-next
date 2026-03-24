/**
 * Persists chosen registration account type without keeping it in the query string.
 * sessionStorage is tab-scoped and cleared when the tab closes.
 *
 * Security note: the API must still enforce which roles/types are allowed; this is UX + privacy only.
 */

export type RegisterAccountRole = 'customer' | 'agent';

const STORAGE_KEY = 'kh_register_account_role';

export function deriveRegisterRoleFromQuery(role: string | null, intent: string | null): RegisterAccountRole {
  if (role === 'agent' || role === 'bailleur' || intent === 'owner') {
    return 'agent';
  }
  if (role === 'customer') {
    return 'customer';
  }

  return 'customer';
}

export function registerUrlHasRoleIntent(searchParams: URLSearchParams): boolean {
  return searchParams.has('role') || searchParams.has('intent');
}

export function readStoredRegisterAccountRole(): RegisterAccountRole | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const v = sessionStorage.getItem(STORAGE_KEY);
  if (v === 'agent' || v === 'customer') {
    return v;
  }

  return null;
}

export function writeStoredRegisterAccountRole(role: RegisterAccountRole): void {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, role);
}

export function clearStoredRegisterAccountRole(): void {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.removeItem(STORAGE_KEY);
}
