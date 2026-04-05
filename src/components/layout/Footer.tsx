'use client';

import Facebook from '@mui/icons-material/Facebook';
import Instagram from '@mui/icons-material/Instagram';
import X from '@mui/icons-material/X';
import { Box, Container, Link, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

const LEGAL_LINKS = [
  { label: 'Confidentialité', href: '/confidentialite' },
  { label: 'Conditions générales', href: '/conditions' },
  { label: 'Infos sur l’entreprise', href: '/aide' },
];

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/keyhomeapp',
    icon: Facebook,
  },
  { label: 'X', href: 'https://twitter.com/keyhome_app', icon: X },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/keyhome_app',
    icon: Instagram,
  },
];

function getLocaleLabel(locale: string): string {
  try {
    const [lang, region] = locale.split('-');
    const langDisplay = new Intl.DisplayNames([locale], { type: 'language' });
    const name = langDisplay.of(lang) ?? lang;
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    if (region) {
      const regionDisplay = new Intl.DisplayNames([locale], { type: 'region' });
      return `${label} (${regionDisplay.of(region) ?? region})`;
    }
    return label;
  } catch {
    return locale;
  }
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [localeLabel, setLocaleLabel] = useState('Français');
  useEffect(() => {
    const lang = navigator.language || document.documentElement.lang || 'fr';
    setLocaleLabel(getLocaleLabel(lang));
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? '#10131A' : '#F5F5F5',
        mt: 'auto',
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          py: 1.4,
          px: { xs: 2, md: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: 1,
          columnGap: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.75,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © {currentYear} KeyHome, Inc.
          </Typography>
          {LEGAL_LINKS.map((link) => (
            <Box
              key={link.label}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
            >
              <Typography variant="caption" color="text.disabled">
                ·
              </Typography>
              <Link
                href={link.href}
                underline="none"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.78rem',
                  '&:hover': {
                    color: 'text.primary',
                    textDecoration: 'underline',
                  },
                }}
              >
                {link.label}
              </Link>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.2,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {localeLabel}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            ·
          </Typography>
          <Typography variant="caption" color="text.disabled">
            ·
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 500 }}
          >
            Powered by{' '}
            <Link
              href="https://www.neocraft.dev"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ color: 'text.secondary', fontWeight: 700 }}
            >
              NeoCraftTeam
            </Link>
          </Typography>
          {SOCIAL_LINKS.map((social) => {
            const Icon = social.icon;
            return (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                underline="none"
                sx={{
                  color: 'text.secondary',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  transition: 'color 0.2s ease, transform 0.2s ease',
                  '&:hover': {
                    color: 'text.primary',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Icon sx={{ fontSize: 14 }} />
              </Link>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
