'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/providers/AuthProvider';
import { FavoritesProvider } from '@/providers/FavoritesProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { LandingThemeProvider } from '@/components/landing/LandingThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <LandingThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <FavoritesProvider>{children}</FavoritesProvider>
            </AuthProvider>
          </ErrorBoundary>
        </LandingThemeProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
