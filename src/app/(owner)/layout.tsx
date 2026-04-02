'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import OwnerLayoutClient from '@/components/owner/OwnerLayoutClient';
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
            <SkipLink />
            <OwnerLayoutClient>{children}</OwnerLayoutClient>
            <CookieBanner variant="owner" />
          </ErrorBoundary>
        </ConfirmDialogProvider>
      </ToastProvider>
    </OwnerThemeProvider>
  );
}
