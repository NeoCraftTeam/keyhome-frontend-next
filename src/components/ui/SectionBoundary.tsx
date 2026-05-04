'use client';

import {
  CloudOff as CloudOffIcon,
  ErrorOutline as ErrorOutlineIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Section-level error boundary — catches errors thrown inside a single page
 * section so the rest of the page keeps working. Designed to be lightweight
 * (no full-page takeover) and panel-aware (auto-detects owner teal vs client
 * pink via the MUI theme `primary.main`).
 *
 * For error states surfaced by `useQuery({ isError: true })` (which don't
 * throw), use `SectionState` instead — both share the same visual language.
 */

interface SectionBoundaryProps {
  /**
   * Optional human label of the section (e.g. "Quartier", "Avis") used in
   * the default fallback heading.
   */
  title?: string;
  /**
   * Optional message override. Defaults to a generic French message.
   */
  message?: string;
  /**
   * Custom fallback. Receives the captured error and a `reset` handler so
   * the section can be re-mounted after fixing.
   */
  fallback?: (props: {
    error: Error;
    reset: () => void;
    isOffline: boolean;
  }) => ReactNode;
  /**
   * Visible offline banner when `navigator.onLine === false`. Defaults to true.
   */
  showOfflineState?: boolean;
  /**
   * Children of the section.
   */
  children: ReactNode;
}

interface SectionBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SectionBoundary extends Component<
  SectionBoundaryProps,
  SectionBoundaryState
> {
  state: SectionBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): SectionBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        '[SectionBoundary]',
        this.props.title ?? '(unnamed)',
        error,
        info
      );
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isOffline =
      typeof navigator !== 'undefined' && navigator.onLine === false;

    if (this.props.fallback && this.state.error) {
      return this.props.fallback({
        error: this.state.error,
        reset: this.reset,
        isOffline,
      });
    }

    return (
      <SectionErrorFallback
        title={this.props.title}
        message={this.props.message}
        isOffline={this.props.showOfflineState !== false && isOffline}
        onRetry={this.reset}
      />
    );
  }
}

/**
 * Visual fallback used by both `SectionBoundary` (thrown errors) and
 * `SectionState` (TanStack `isError`). Compact, panel-aware, French.
 */
export function SectionErrorFallback({
  title,
  message,
  isOffline = false,
  onRetry,
}: {
  title?: string;
  message?: string;
  isOffline?: boolean;
  onRetry?: () => void;
}): React.ReactElement {
  const theme = useTheme();

  const heading = isOffline
    ? 'Vous êtes hors connexion'
    : title
      ? `Impossible de charger : ${title}`
      : 'Cette section est temporairement indisponible';

  const body =
    message ??
    (isOffline
      ? 'Vérifiez votre connexion internet puis réessayez. Le reste de la page reste accessible.'
      : 'Le reste de la page fonctionne normalement. Vous pouvez recharger uniquement cette partie.');

  return (
    <Box
      role="alert"
      aria-live="polite"
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: (t) =>
          t.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.02)'
            : 'rgba(0,0,0,0.015)',
        px: 2.5,
        py: 2.25,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.75,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isOffline ? 'warning.lighter' : 'error.lighter',
          color: isOffline ? 'warning.main' : 'error.main',
        }}
      >
        {isOffline ? (
          <CloudOffIcon sx={{ fontSize: 20 }} />
        ) : (
          <ErrorOutlineIcon sx={{ fontSize: 20 }} />
        )}
      </Box>
      <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ lineHeight: 1.3 }}
        >
          {heading}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.55 }}
        >
          {body}
        </Typography>
        {onRetry ? (
          <Box sx={{ pt: 0.5 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
              onClick={onRetry}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: theme.palette.divider,
                color: 'text.primary',
                minHeight: 36,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  bgcolor: 'transparent',
                },
              }}
            >
              Réessayer
            </Button>
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}

export default SectionBoundary;
