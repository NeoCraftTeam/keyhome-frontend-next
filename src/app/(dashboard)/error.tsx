'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { gradient } from '@/theme/tokens';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          py: 8,
        }}
      >
        <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Quelque chose s&apos;est mal passé
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          Une erreur inattendue est survenue. Veuillez réessayer.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={reset}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              background: gradient.primary,
              '&:hover': { background: gradient.primaryHover },
            }}
          >
            Réessayer
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{ borderRadius: 2 }}
          >
            Recharger la page
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
