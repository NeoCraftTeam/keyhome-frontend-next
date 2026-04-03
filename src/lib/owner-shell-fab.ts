/**
 * FAB « action rapide » : uniquement là où « nouvelle annonce » est pertinent.
 * Sur le tableau de bord et les autres écrans, pas de FAB (menu avatar / liste annonces).
 */
export function shouldShowOwnerQuickCreateFab(
  pathname: string | null
): boolean {
  if (!pathname?.startsWith('/owner/')) {
    return false;
  }

  if (
    pathname.startsWith('/owner/login') ||
    pathname.startsWith('/owner/register') ||
    pathname.startsWith('/owner/forgot-password')
  ) {
    return false;
  }

  if (pathname === '/owner/ads/new') {
    return false;
  }

  if (/^\/owner\/ads\/[^/]+\/edit$/.test(pathname)) {
    return false;
  }

  return false;
}
