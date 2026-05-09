'use client';

import ComparatorBar from '@/components/ads/ComparatorBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SafeAreaInsetBridge } from '@/components/pwa/SafeAreaInsetBridge';
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog';
import SkipLink from '@/components/ui/SkipLink';
import { UtmCaptureProvider } from '@/components/utm/UtmCaptureProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ComparatorProvider } from '@/providers/ComparatorProvider';
import { CurrencyProvider } from '@/providers/CurrencyProvider';
import { FavoritesProvider } from '@/providers/FavoritesProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

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
          <SkipLink />
          <ErrorBoundary>
            <AuthProvider>
              <SafeAreaInsetBridge />
              {/* Geo-aware currency (FCFA → EUR/USD/…). `kh_currency` /
                  `kh_country` are set in `src/proxy.ts` from `CF-IPCountry`
                  (Cloudflare orange cloud) or `x-vercel-ip-country` (Vercel);
                  local dev defaults to CM → XAF when those headers are absent. */}
              <CurrencyProvider>
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
              </CurrencyProvider>
            </AuthProvider>
          </ErrorBoundary>
        </UtmCaptureProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
