'use client';

import { brandAgent, gradient } from '@/theme/tokens';
import { Box, Button, Container, Typography } from '@mui/material';
import Link from 'next/link';

/** Route introuvable dans le segment bailleur (/owner/*). */
export default function OwnerNotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="overline" color="primary" fontWeight={700}>
          Espace bailleur
        </Typography>
        <Typography variant="h5" component="h1" fontWeight={800} gutterBottom>
          Page introuvable
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ mb: 4, mx: 'auto', maxWidth: 440 }}
        >
          Cette page n&apos;existe pas ou le lien est obsolète. Retournez au
          tableau de bord ou utilisez le menu latéral.
        </Typography>
        <Button
          component={Link}
          href="/owner/dashboard"
          variant="contained"
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            background: gradient.agent,
            '&:hover': { background: gradient.agentHover },
            '&:focus-visible': {
              outline: `2px solid ${brandAgent.primary}`,
              outlineOffset: 2,
            },
          }}
        >
          Tableau de bord
        </Button>
      </Box>
    </Container>
  );
}
