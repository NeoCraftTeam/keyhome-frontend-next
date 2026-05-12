'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { brandAgent, gradient, shadow } from '@/theme/tokens';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Alert, Box, Button, Container, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

export default function OwnerSegmentError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isOnline = useNetworkStatus();

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
        {!isOnline && (
          <Alert
            severity="warning"
            role="status"
            sx={{
              mb: 2,
              width: '100%',
              maxWidth: 440,
              textAlign: 'left',
            }}
          >
            Connexion réseau indisponible. Vérifiez votre Wi‑Fi ou données
            mobiles, puis réessayez.
          </Alert>
        )}
        <Box
          sx={{
            mb: 2,
            width: 72,
            height: 72,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(brandAgent.primary, 0.1),
            border: `1px solid ${brandAgent.primaryAlpha20}`,
          }}
        >
          <ErrorOutlineIcon
            sx={{ fontSize: 40, color: 'error.main' }}
            aria-hidden
          />
        </Box>
        <Typography variant="h5" fontWeight={700} gutterBottom component="h1">
          Une erreur est survenue
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 420 }}
          role="alert"
          aria-live="polite"
        >
          L’espace bailleur a rencontré un problème. Vous pouvez réessayer ou
          recharger la page. Si le souci continue, contactez le support.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Button
            variant="contained"
            onClick={() => reset()}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 600,
              background: gradient.agent,
              '&:hover': { background: gradient.agentHover },
              '&:focus-visible': {
                outline: 'none',
                boxShadow: shadow.agentFocusRing,
              },
            }}
          >
            Réessayer
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              borderColor: brandAgent.primaryAlpha25,
              '&:hover': {
                borderColor: brandAgent.primary,
                bgcolor: alpha(brandAgent.primary, 0.04),
              },
              '&:focus-visible': {
                outline: 'none',
                boxShadow: shadow.agentFocusRing,
              },
            }}
          >
            Recharger la page
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
