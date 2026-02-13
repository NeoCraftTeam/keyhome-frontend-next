'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/providers/AuthProvider';
import { FavoritesProvider } from '@/providers/FavoritesProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AuthProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryProvider>
  );
}
