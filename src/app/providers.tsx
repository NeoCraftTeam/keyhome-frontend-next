'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/providers/AuthProvider';
import { ComparatorProvider } from '@/providers/ComparatorProvider';
import { FavoritesProvider } from '@/providers/FavoritesProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import ComparatorBar from '@/components/ads/ComparatorBar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
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
      </ThemeProvider>
    </QueryProvider>
  );
}
