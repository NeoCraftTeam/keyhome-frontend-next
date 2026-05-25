const PLACARDE_PATH_RE = /^\/owner\/ads\/[^/]+\/placarde\/?$/;

/** Full-screen A5 placard preview route (no owner sidebar / bottom nav). */
export function isOwnerPlacardePreviewPath(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  return PLACARDE_PATH_RE.test(pathname);
}

function placardePathForAd(adId: string): string {
  return `/owner/ads/${encodeURIComponent(adId)}/placarde`;
}

/** Open the full A5 placard PDF preview in a new tab (browser PDF viewer only). */
export function openAdPlacardePreview(adId: string): void {
  window.open(placardePathForAd(adId), '_blank', 'noopener,noreferrer');
}
