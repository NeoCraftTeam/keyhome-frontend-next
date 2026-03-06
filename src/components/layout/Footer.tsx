'use client';

import { getOwnerUrl } from '@/lib/constants';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { Box, Button, Container, Divider, Grid, Link, Typography } from '@mui/material';

const footerSections = [
  {
    title: 'KeyHome',
    links: [
      { label: 'Comment ça marche', href: '/#how-it-works' },
      { label: 'Témoignages', href: '/#testimonials' },
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
      { label: "Centre d'aide", href: '/aide' },
      { label: "Conditions d'utilisation", href: '/conditions' },
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
      {/* ── Espace pour les hôtes (bailleurs) ─────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(246,71,95,0.06) 0%, rgba(246,71,95,0.02) 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: { xs: 3.5, md: 4 },
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 2, sm: 3 },
            }}
          >
            <Box sx={{ maxWidth: 540 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 0.4, display: 'flex', alignItems: 'center', gap: 0.75 }}
              >
                Espace pour les hôtes{' '}
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400, fontSize: '0.875rem' }}>
                  (bailleurs)
                </Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Vous êtes propriétaire ou bailleur&nbsp;? Publiez vos annonces immobilières gratuitement et
                touchez des milliers de locataires et acheteurs potentiels.
              </Typography>
            </Box>
            <Button
              component="a"
              href={getOwnerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              size="medium"
              endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
              sx={{
                flexShrink: 0,
                borderRadius: '20px',
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                background: 'linear-gradient(135deg, #F6475F, #D93A50)',
                boxShadow: '0 4px 16px rgba(246,71,95,0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(246,71,95,0.45)',
                  background: 'linear-gradient(135deg, #e83d54, #c93347)',
                },
                whiteSpace: 'nowrap',
              }}
            >
              Publier une annonce
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── Main footer links ─────────────────────────────────────────── */}
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} KeyHome. Tous droits réservés.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Propulsé par{' '}
            <Link
              href="https://www.neocraft.dev"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ color: 'text.secondary', fontWeight: 600 }}
            >
              NeoCraftTeam
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
