'use client';

import ComparatorBar from '@/components/ads/ComparatorBar';
import { GoogleMarketing } from '@/components/analytics/GoogleMarketing';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SafeAreaInsetBridge } from '@/components/pwa/SafeAreaInsetBridge';
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog';
import SkipLink from '@/components/ui/SkipLink';
import { UtmCaptureProvider } from '@/components/utm/UtmCaptureProvider';
import { isGoogleMarketingConfigured } from '@/lib/analytics/google-marketing-env';
import { AuthProvider } from '@/providers/AuthProvider';
import { ComparatorProvider } from '@/providers/ComparatorProvider';
import { FavoritesProvider } from '@/providers/FavoritesProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { MotionConfig } from 'framer-motion';

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
      {/* Global motion safety net: any framer-motion animation under this tree
          honours the user's `prefers-reduced-motion` OS preference. Individual
          pages may still narrow it (e.g. `reducedMotion="always"`) — this is the
          accessibility-safe default (WCAG 2.3.3). */}
      <MotionConfig reducedMotion="user">
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
      </MotionConfig>
    </QueryProvider>
  );
}
