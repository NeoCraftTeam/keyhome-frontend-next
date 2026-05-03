/**
 * Syncs `--kh-safe-area-top` / `--kh-safe-area-bottom` on `<html>` from a
 * layout pass that resolves `env(safe-area-inset-*)` reliably — iOS/Android
 * PWAs sometimes report `0px` until a later frame or after meta/viewport
 * settles; this takes the max of previous and measured values.
 */
export function syncKhSafeAreaInsets(): void {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    const root = document.documentElement;
    const prevTop = parseFloat(
      getComputedStyle(root).getPropertyValue('--kh-safe-area-top')
    );
    const prevBottom = parseFloat(
      getComputedStyle(root).getPropertyValue('--kh-safe-area-bottom')
    );

    const probeTop = document.createElement('div');
    probeTop.setAttribute('data-kh-safe-probe', 'top');
    probeTop.style.cssText =
      'position:fixed;left:0;top:0;width:100%;height:env(safe-area-inset-top,0px);' +
      'pointer-events:none;visibility:hidden;z-index:-1';
    root.appendChild(probeTop);
    const topPx = probeTop.getBoundingClientRect().height;
    probeTop.remove();

    const probeBottom = document.createElement('div');
    probeBottom.setAttribute('data-kh-safe-probe', 'bottom');
    probeBottom.style.cssText =
      'position:fixed;left:0;bottom:0;width:100%;height:env(safe-area-inset-bottom,0px);' +
      'pointer-events:none;visibility:hidden;z-index:-1';
    root.appendChild(probeBottom);
    const bottomPx = probeBottom.getBoundingClientRect().height;
    probeBottom.remove();

    const top = Math.max(Number.isFinite(prevTop) ? prevTop : 0, topPx, 0);
    const bottom = Math.max(
      Number.isFinite(prevBottom) ? prevBottom : 0,
      bottomPx,
      0
    );

    root.style.setProperty('--kh-safe-area-top', `${top}px`);
    root.style.setProperty('--kh-safe-area-bottom', `${bottom}px`);
  } catch {
    /* ignore — never block rendering */
  }
}

/** MUI `sx` / CSS strings: use env() and JS-updated fallbacks together */
export const khSafeAreaTopSx =
  'max(env(safe-area-inset-top, 0px), var(--kh-safe-area-top))';

export const khSafeAreaBottomSx =
  'max(env(safe-area-inset-bottom, 0px), var(--kh-safe-area-bottom))';

/** In-flow spacer under fixed AppBar (toolbar height + top inset). */
export const khNavbarSpacerMinHeightXs = `calc(56px + ${khSafeAreaTopSx})`;

export const khNavbarSpacerMinHeightMd = `calc(64px + ${khSafeAreaTopSx})`;
