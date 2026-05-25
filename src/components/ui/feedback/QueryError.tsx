'use client';

import ErrorIcon from '@mui/icons-material/ErrorOutline';
import { Box, Button, Link, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface QueryErrorProps {
  /** Called when the user clicks "Réessayer" — typically refetch() from useQuery */
  onRetry?: () => void;
  /** Custom message (default: "Une erreur est survenue lors du chargement.") */
  message?: string;
  /** Compact variant for inline use (smaller padding, no min-height) */
  compact?: boolean;
  /** Show "Contacter le support" link */
  showSupportLink?: boolean;
}

/**
 * Friendly error state for failed React Query fetches.
 * Follows the same visual style as the global ErrorBoundary.
 */
const EMPTY_STATE_ICON_SIZE = 56;

export default function QueryError({
  onRetry,
  message = "Nous n'avons pas pu charger les données. Réessayez dans un instant.",
  compact = false,
  showSupportLink = false,
}: QueryErrorProps) {
  const theme = useTheme();
  const gradient = theme.palette.gradient;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: compact ? 4 : 8,
        px: 2,
        ...(compact ? {} : { minHeight: '30vh' }),
      }}
    >
      <ErrorIcon
        sx={{
          fontSize: compact ? 48 : EMPTY_STATE_ICON_SIZE,
          color: 'error.main',
          mb: 2,
        }}
      />
      <Typography
        variant={compact ? 'subtitle1' : 'h6'}
        fontWeight={600}
        gutterBottom
      >
        Un petit souci de connexion
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 400 }}
      >
        {message}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {onRetry && (
          <Button
            variant="contained"
            onClick={onRetry}
            sx={{
              borderRadius: 2,
              ...(gradient && {
                background: gradient.primary,
                '&:hover': { background: gradient.primaryHover },
              }),
            }}
          >
            Réessayer
          </Button>
        )}
        {showSupportLink && (
          <Link
            href="/contact"
            color="primary.main"
            sx={{ fontSize: '0.875rem', fontWeight: 500 }}
          >
            Contacter le support
          </Link>
        )}
      </Box>
    </Box>
  );
}
