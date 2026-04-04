'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import OwnerLayoutClient from '@/components/owner/OwnerLayoutClient';
import OwnerManifestSwitch from '@/components/owner/OwnerManifestSwitch';
import OwnerPWAInstallPrompt from '@/components/owner/OwnerPWAInstallPrompt';
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog';
import CookieBanner from '@/components/ui/CookieBanner';
import SkipLink from '@/components/ui/SkipLink';
import { OwnerThemeProvider } from '@/providers/OwnerThemeProvider';
import ToastProvider from '@/providers/ToastProvider';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OwnerThemeProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          <ErrorBoundary>
            <OwnerManifestSwitch />
            <SkipLink />
            <OwnerLayoutClient>{children}</OwnerLayoutClient>
            <OwnerPWAInstallPrompt />
            <CookieBanner variant="owner" />
          </ErrorBoundary>
        </ConfirmDialogProvider>
      </ToastProvider>
    </OwnerThemeProvider>
  );
}
