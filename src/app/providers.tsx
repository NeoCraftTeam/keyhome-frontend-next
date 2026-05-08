'use client';

import { GoogleMarketing } from '@/components/analytics/GoogleMarketing';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UtmCaptureProvider } from '@/components/utm/UtmCaptureProvider';
import { isGoogleMarketingConfigured } from '@/lib/analytics/google-marketing-env';
import SkipLink from '@/components/ui/SkipLink';
import { AuthProvider } from '@/providers/AuthProvider';
import { ComparatorProvider } from '@/providers/ComparatorProvider';
import { FavoritesProvider } from '@/providers/FavoritesProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import ComparatorBar from '@/components/ads/ComparatorBar';
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog';
import { SafeAreaInsetBridge } from '@/components/pwa/SafeAreaInsetBridge';

/**
 * Note: `SessionTimeoutGuard` is intentionally NOT mounted here. It must live
 * inside each panel-specific layout so the modal inherits the right MUI theme
 * (`primary.main` = pink for the client panel, teal for the owner panel).
 * Mounting it at the global root forced the modal to always render in pink.
 */
export function Providers({
  children,
  nonce = '',
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  return (
    <QueryProvider>
      <ThemeProvider nonce={nonce}>
        <UtmCaptureProvider>
          {isGoogleMarketingConfigured() ? (
            <GoogleMarketing nonce={nonce} />
          ) : null}
          <SkipLink />
          <ErrorBoundary>
            <AuthProvider>
              <SafeAreaInsetBridge />
              <FavoritesProvider>
                <ComparatorProvider>
                  {/* Confirm dialogs (`useConfirm`) are used by both panels
                      (e.g. owner /ads action menu, dashboard search alerts).
                      Mounted globally; the dialog inherits the surrounding
                      panel theme (pink client / teal owner) at render time. */}
                  <ConfirmDialogProvider>
                    {children}
                    <ComparatorBar />
                  </ConfirmDialogProvider>
                </ComparatorProvider>
              </FavoritesProvider>
            </AuthProvider>
          </ErrorBoundary>
        </UtmCaptureProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
