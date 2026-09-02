'use client';

import { Box, Button, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import { brand } from '@/theme/tokens';

export default function AuthError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        p: 4,
      }}
    >
      <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Quelque chose s&apos;est mal passé
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 400 }}
      >
        Une erreur est survenue. Veuillez réessayer ou retourner à la connexion.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={reset}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            background: brand.primary,
            '&:hover': { background: brand.primaryHover },
          }}
        >
          Réessayer
        </Button>
        <Button variant="outlined" href="/login" sx={{ borderRadius: 2 }}>
          Retour à la connexion
        </Button>
      </Box>
    </Box>
  );
}
