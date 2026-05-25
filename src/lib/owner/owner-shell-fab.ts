/**
 * FAB « Nouvelle annonce » : mobile, uniquement sur la liste des annonces.
 * Masqué sur les routes d’auth, la création (`/new`) et la fiche édition (`/owner/ads/:id`).
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

  if (pathname === '/owner/ads') {
    return true;
  }

  return false;
}
