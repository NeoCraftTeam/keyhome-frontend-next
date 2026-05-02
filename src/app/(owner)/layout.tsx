'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import OwnerLayoutClient from '@/components/owner/OwnerLayoutClient';
import OwnerManifestSwitch from '@/components/owner/OwnerManifestSwitch';
import OwnerPWAInstallPrompt from '@/components/owner/OwnerPWAInstallPrompt';
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog';
import SkipLink from '@/components/ui/SkipLink';
import { OwnerThemeProvider } from '@/providers/OwnerThemeProvider';
import ToastProvider from '@/providers/ToastProvider';
import SessionTimeoutGuard from '@/components/session/SessionTimeoutGuard';

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
            {/*
              CookieBanner is mounted globally at the root layout (`auto`
              variant detects the panel from the pathname). Mounting it here
              too caused a brief pink → teal flash when navigating
              client → owner because both copies briefly coexisted.
             */}
            {/* Mounted inside OwnerThemeProvider so the modal inherits teal primary. */}
            <SessionTimeoutGuard />
          </ErrorBoundary>
        </ConfirmDialogProvider>
      </ToastProvider>
    </OwnerThemeProvider>
  );
}
