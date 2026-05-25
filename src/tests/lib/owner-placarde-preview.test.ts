import { describe, expect, it, vi } from 'vitest';
import {
  isOwnerPlacardePreviewPath,
  openAdPlacardePreview,
} from '@/lib/owner/owner-placarde-preview';

describe('owner-placarde-preview', () => {
  it('detects placarde preview routes', () => {
    expect(isOwnerPlacardePreviewPath('/owner/ads/abc/placarde')).toBe(true);
    expect(isOwnerPlacardePreviewPath('/owner/ads/abc/placarde/')).toBe(true);
    expect(isOwnerPlacardePreviewPath('/owner/ads')).toBe(false);
    expect(isOwnerPlacardePreviewPath(null)).toBe(false);
  });

  it('opens the preview route in a new tab', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    openAdPlacardePreview('ad-456');

    expect(openSpy).toHaveBeenCalledWith(
      '/owner/ads/ad-456/placarde',
      '_blank',
      'noopener,noreferrer'
    );

    openSpy.mockRestore();
  });
});
