'use client';

import OwnerLayoutClient from '@/components/owner/OwnerLayoutClient';
import OwnerManifestSwitch from '@/components/owner/OwnerManifestSwitch';
import OwnerPWAInstallPrompt from '@/components/pwa/OwnerPWAInstallPrompt';
import { OwnerThemeProvider } from '@/providers/OwnerThemeProvider';

/**
 * Client shell for the owner route group: manifest / theme-color swaps,
 * layout chrome, and install prompt for `manifest-owner.json`.
 *
 * `OwnerThemeProvider` must wrap every owner route (including public
 * `/owner/login`) so MUI `primary` is teal — otherwise the root app theme
 * (customer pink) bleeds in and breaks bailleur branding.
 */
export default function OwnerLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OwnerManifestSwitch />
      <OwnerThemeProvider>
        <OwnerLayoutClient>{children}</OwnerLayoutClient>
        <OwnerPWAInstallPrompt />
      </OwnerThemeProvider>
    </>
  );
}
