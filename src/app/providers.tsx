'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UtmCaptureProvider } from '@/components/utm/UtmCaptureProvider';
import SkipLink from '@/components/ui/SkipLink';
import { AuthProvider } from '@/providers/AuthProvider';
import { ComparatorProvider } from '@/providers/ComparatorProvider';
import { FavoritesProvider } from '@/providers/FavoritesProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import ComparatorBar from '@/components/ads/ComparatorBar';
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
          <SkipLink />
          <ErrorBoundary>
            <AuthProvider>
              <SafeAreaInsetBridge />
              <FavoritesProvider>
                <ComparatorProvider>
                  {children}
                  <ComparatorBar />
                </ComparatorProvider>
              </FavoritesProvider>
            </AuthProvider>
          </ErrorBoundary>
        </UtmCaptureProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
