'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import { SearchOff } from '@mui/icons-material';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 8,
        }}
      >
        <SearchOff sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
        <Typography variant="h3" fontWeight={800} gutterBottom>
          404
        </Typography>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Page introuvable
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 380 }}>
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            component={Link}
            href="/"
            variant="contained"
            size="large"
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(to right, #F6475F, #D93A50)',
              '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
              '&:active': { transform: 'scale(0.97)' },
            }}
          >
            Accueil
          </Button>
          <Button
            component={Link}
            href="/search"
            variant="outlined"
            size="large"
            sx={{ fontWeight: 600 }}
          >
            Rechercher
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
