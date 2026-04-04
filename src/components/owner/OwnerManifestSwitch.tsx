'use client';

import { useEffect } from 'react';

const OWNER_MANIFEST = '/manifest-owner.json';
const OWNER_THEME = '#0D9488';
const OWNER_BG = '#134E4A';

/**
 * Swaps the global PWA manifest and theme-color to the teal owner branding
 * while any owner panel page is mounted.  Restores the originals on unmount
 * so navigating back to the customer side is seamless.
 *
 * Works by direct DOM mutation — the only reliable cross-browser method
 * when the root layout is a server component that already emitted the tags.
 */
export default function OwnerManifestSwitch() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // ── Manifest link ────────────────────────────────────────────────────────
    let manifestEl = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]'
    );
    const originalManifest = manifestEl?.href ?? '';

    if (manifestEl) {
      manifestEl.href = OWNER_MANIFEST;
    } else {
      manifestEl = document.createElement('link');
      manifestEl.rel = 'manifest';
      manifestEl.href = OWNER_MANIFEST;
      document.head.appendChild(manifestEl);
    }

    // ── theme-color meta tags ────────────────────────────────────────────────
    const themeColorEls = document.querySelectorAll<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    const originalThemes: string[] = [];
    themeColorEls.forEach((el) => {
      originalThemes.push(el.content);
      el.content = OWNER_THEME;
    });

    // If no theme-color meta exists yet, inject one
    let injectedTheme: HTMLMetaElement | null = null;
    if (themeColorEls.length === 0) {
      injectedTheme = document.createElement('meta');
      injectedTheme.name = 'theme-color';
      injectedTheme.content = OWNER_THEME;
      document.head.appendChild(injectedTheme);
    }

    // ── ms-application-TileColor (Windows tiles) ─────────────────────────────
    const tileEl = document.querySelector<HTMLMetaElement>(
      'meta[name="msapplication-TileColor"]'
    );
    const originalTile = tileEl?.content ?? '';
    if (tileEl) tileEl.content = OWNER_BG;

    // ── apple-mobile-web-app-status-bar-style ────────────────────────────────
    const appleStatusEl = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    const originalAppleStatus = appleStatusEl?.content ?? '';
    if (appleStatusEl) appleStatusEl.content = 'default';

    // ── apple-mobile-web-app-title (label under iOS home-screen icon) ────────
    const appleTitleEl = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]'
    );
    const originalAppleTitle = appleTitleEl?.content ?? '';
    if (appleTitleEl) {
      appleTitleEl.content = 'KH Propriétaire';
    } else {
      const el = document.createElement('meta');
      el.name = 'apple-mobile-web-app-title';
      el.content = 'KH Propriétaire';
      document.head.appendChild(el);
    }

    // ── application-name ─────────────────────────────────────────────────────
    const appNameEl = document.querySelector<HTMLMetaElement>(
      'meta[name="application-name"]'
    );
    const originalAppName = appNameEl?.content ?? '';
    if (appNameEl) appNameEl.content = 'KeyHome Propriétaire';

    // ── apple-touch-icon → teal logo ─────────────────────────────────────────
    const appleTouchEl = document.querySelector<HTMLLinkElement>(
      'link[rel="apple-touch-icon"]'
    );
    const originalAppleIcon = appleTouchEl?.href ?? '';
    if (appleTouchEl) appleTouchEl.href = '/images/logo-teal.png';

    // ── Restore on unmount ───────────────────────────────────────────────────
    return () => {
      if (manifestEl) {
        if (originalManifest) {
          manifestEl.href = originalManifest;
        } else {
          manifestEl.remove();
        }
      }

      themeColorEls.forEach((el, i) => {
        el.content = originalThemes[i] ?? '';
      });
      injectedTheme?.remove();

      if (tileEl) tileEl.content = originalTile;
      if (appleStatusEl) appleStatusEl.content = originalAppleStatus;

      const currentAppleTitleEl = document.querySelector<HTMLMetaElement>(
        'meta[name="apple-mobile-web-app-title"]'
      );
      if (currentAppleTitleEl) {
        if (originalAppleTitle) {
          currentAppleTitleEl.content = originalAppleTitle;
        } else {
          currentAppleTitleEl.remove();
        }
      }

      if (appNameEl) appNameEl.content = originalAppName;
      if (appleTouchEl) appleTouchEl.href = originalAppleIcon;
    };
  }, []);

  return null;
}
