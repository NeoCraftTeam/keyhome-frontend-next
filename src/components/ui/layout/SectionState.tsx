'use client';

import { Box } from '@mui/material';
import type { ReactElement, ReactNode } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { EmptyState, type EmptyStateProps } from '../feedback/EmptyState';
import { SectionErrorFallback } from './SectionBoundary';

/**
 * Unified loading / error / empty / data wrapper for any in-page section
 * driven by an async hook (TanStack Query, SWR, etc.).
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, isError, error, refetch } = useQuery(...);
 * <SectionState
 *   title="Avis"
 *   isLoading={isLoading}
 *   loadingFallback={<ReviewsSkeleton />}
 *   isError={isError}
 *   error={error}
 *   onRetry={() => refetch()}
 *   isEmpty={!data?.length}
 *   emptyState={{ title: 'Aucun avis pour le moment' }}
 * >
 *   <ReviewsList reviews={data!} />
 * </SectionState>
 * ```
 *
 * The component is panel-aware (pink for client / teal for owner) via the
 * inherited MUI theme, and it surfaces a dedicated offline banner when
 * `navigator.onLine === false`.
 */
export interface SectionStateProps {
  /**
   * Human label (e.g. "Avis", "Quartier") used in default error / offline copy.
   */
  title?: string;

  /**
   * Loading flag (TanStack Query `isLoading` or `isPending`).
   */
  isLoading?: boolean;
  /**
   * Custom skeleton / placeholder displayed while loading.
   */
  loadingFallback?: ReactNode;

  /**
   * Error flag (TanStack Query `isError`).
   */
  isError?: boolean;
  /**
   * Captured error — used to surface a more contextual message in dev.
   */
  error?: Error | unknown | null;
  /**
   * Optional retry callback (typically `() => refetch()`).
   */
  onRetry?: () => void;
  /**
   * Disable the offline-aware copy. Defaults to `false` (offline detection ON).
   */
  ignoreOffline?: boolean;

  /**
   * Empty flag — typically `data.length === 0`.
   */
  isEmpty?: boolean;
  /**
   * Empty state configuration. When provided, it's rendered via `EmptyState`.
   */
  emptyState?: EmptyStateProps;

  /**
   * The actual section content — only rendered in the success state.
   */
  children: ReactNode;
}

export function SectionState({
  title,
  isLoading = false,
  loadingFallback,
  isError = false,
  error,
  onRetry,
  ignoreOffline = false,
  isEmpty = false,
  emptyState,
  children,
}: SectionStateProps): ReactElement {
  const isOnline = useNetworkStatus();
  const isOffline = !ignoreOffline && !isOnline;

  // Show offline banner if we're offline AND the section can't render its data
  // either because it's currently in error or in initial loading with no cache.
  if (isOffline && (isError || isLoading)) {
    return (
      <Box>
        <SectionErrorFallback title={title} isOffline onRetry={onRetry} />
      </Box>
    );
  }

  if (isLoading) {
    return <Box>{loadingFallback ?? <DefaultSkeleton />}</Box>;
  }

  if (isError) {
    const message =
      error instanceof Error ? extractFriendlyMessage(error) : undefined;

    return (
      <Box>
        <SectionErrorFallback
          title={title}
          message={message}
          onRetry={onRetry}
        />
      </Box>
    );
  }

  if (isEmpty) {
    if (emptyState) {
      return (
        <Box>
          <EmptyState {...emptyState} />
        </Box>
      );
    }
    // Without explicit emptyState we still render children — the parent owns it.
    return <Box>{children}</Box>;
  }

  return <Box>{children}</Box>;
}

function DefaultSkeleton(): ReactElement {
  return (
    <Box
      sx={{
        height: 120,
        borderRadius: 2,
        bgcolor: (t) =>
          t.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(0,0,0,0.04)',
        animation: 'pulse 1.5s ease-in-out infinite',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
        },
      }}
    />
  );
}

/**
 * Best-effort French copy from common HTTP / network errors. Falls through
 * to the generic message in `SectionErrorFallback` when no pattern matches.
 */
function extractFriendlyMessage(error: Error): string | undefined {
  const msg = error.message ?? '';
  if (
    /network|failed to fetch|fetch failed|ECONNREFUSED|ETIMEDOUT/i.test(msg)
  ) {
    return 'Le serveur est injoignable. Réessayez dans quelques instants.';
  }
  if (/timeout/i.test(msg)) {
    return "Le délai d'attente a été dépassé. Réessayez.";
  }
  if (/40[34]/.test(msg)) {
    return 'Cette ressource est introuvable.';
  }
  if (/401|unauthorized/i.test(msg)) {
    return 'Vous devez être connecté pour voir cette section.';
  }
  if (/403|forbidden/i.test(msg)) {
    return 'Accès non autorisé à cette section.';
  }
  if (/5\d\d/.test(msg)) {
    return 'Le serveur rencontre une erreur. Veuillez réessayer plus tard.';
  }
  return undefined;
}

export default SectionState;
