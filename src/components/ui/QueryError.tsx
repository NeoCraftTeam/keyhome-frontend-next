'use client';

import { ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

interface QueryErrorProps {
  /** Called when the user clicks "Réessayer" — typically refetch() from useQuery */
  onRetry?: () => void;
  /** Custom message (default: "Une erreur est survenue lors du chargement.") */
  message?: string;
  /** Compact variant for inline use (smaller padding, no min-height) */
  compact?: boolean;
}

/**
 * Friendly error state for failed React Query fetches.
 * Follows the same visual style as the global ErrorBoundary.
 */
export default function QueryError({
  onRetry,
  message = 'Une erreur est survenue lors du chargement.',
  compact = false,
}: QueryErrorProps) {
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
      <ErrorIcon sx={{ fontSize: compact ? 48 : 64, color: 'error.main', mb: 2 }} />
      <Typography variant={compact ? 'subtitle1' : 'h6'} fontWeight={600} gutterBottom>
        Quelque chose s&apos;est mal passé
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
        {message}
      </Typography>
      {onRetry && (
        <Button
          variant="contained"
          onClick={onRetry}
          sx={{
            borderRadius: 2,
            background: 'linear-gradient(to right, #F6475F, #D93A50)',
            '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
          }}
        >
          Réessayer
        </Button>
      )}
    </Box>
  );
}
