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

export function Providers({ children, nonce = '' }: { children: React.ReactNode; nonce?: string }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <UtmCaptureProvider>
          <SkipLink />
          <ErrorBoundary>
            <AuthProvider>
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
