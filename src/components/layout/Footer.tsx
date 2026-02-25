'use client';

import { Box, Container, Typography, Divider, Link, Grid } from '@mui/material';

const footerSections = [
  {
    title: 'KeyHome',
    links: [
      { label: 'À propos', href: '#' },
      { label: 'Comment ça marche', href: '#' },
      { label: 'Carrières', href: '#' },
    ],
  },
  {
    title: 'Découvrir',
    links: [
      { label: 'Locations', href: '/search?type=location' },
      { label: 'Ventes', href: '/search?type=vente' },
      { label: 'Terrains', href: '/search?type=terrain' },
    ],
  },
  {
    title: 'Aide',
    links: [
      { label: 'Centre d\'aide', href: '#' },
      { label: 'Conditions d\'utilisation', href: '/conditions' },
      { label: 'Politique de confidentialité', href: '/confidentialite' },
    ],
  },
];

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {footerSections.map((section) => (
            <Grid key={section.title} size={{ xs: 12, sm: 4 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                {section.title}
              </Typography>
              {section.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  underline="none"
                  display="block"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    py: 0.3,
                    '&:hover': { textDecoration: 'underline', color: 'text.primary' },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} KeyHome. Tous droits réservés.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Powered by{' '}
          <Link
            href="https://www.neocraft.dev"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ color: 'text.secondary', fontWeight: 500 }}
          >
            Neocraft Team
          </Link>
        </Typography>
      </Container>
    </Box>
  );
}
