'use client';

import Apartment from '@mui/icons-material/Apartment';
import Shield from '@mui/icons-material/Shield';
import SupportAgent from '@mui/icons-material/SupportAgent';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import { Box, Container, Divider, Typography, useTheme } from '@mui/material';
import { brand, semantic } from '@/theme/tokens';

const STATS = [
  {
    Icon: Apartment,
    value: '12 000+',
    label: 'Annonces vérifiées',
    color: brand.primary,
  },
  {
    Icon: VerifiedUser,
    value: '98%',
    label: 'Propriétaires certifiés',
    color: semantic.purple,
  },
  {
    Icon: SupportAgent,
    value: '4.8/5',
    label: 'Satisfaction client',
    color: semantic.successBright,
  },
  {
    Icon: Shield,
    value: '100%',
    label: 'Coordonnées garanties',
    color: semantic.info,
  },
] as const;

export default function TrustStrip() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component="section"
      aria-label="Chiffres clés KeyHome"
      sx={{
        bgcolor: isDark ? 'background.paper' : '#FAFAFA',
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: { xs: 2.5, md: 3 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', md: 'center' },
            gap: { xs: 0, md: 0 },
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {STATS.map((stat, idx) => (
            <Box
              key={stat.label}
              sx={{ display: 'flex', alignItems: 'stretch' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'row', md: 'column' },
                  alignItems: 'center',
                  gap: { xs: 1, md: 0.5 },
                  px: { xs: 2.5, md: 4 },
                  py: { xs: 0.5, md: 0.75 },
                  flexShrink: 0,
                  textAlign: { xs: 'left', md: 'center' },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 32, md: 40 },
                    height: { xs: 32, md: 40 },
                    borderRadius: '50%',
                    bgcolor: `${stat.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mb: { xs: 0, md: 0.5 },
                  }}
                >
                  <stat.Icon
                    sx={{ fontSize: { xs: 18, md: 22 }, color: stat.color }}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{
                      fontSize: { xs: '1rem', md: '1.25rem' },
                      lineHeight: 1.1,
                      color: 'text.primary',
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.7rem', md: '0.75rem' },
                      fontWeight: 500,
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Box>
              {idx < STATS.length - 1 && (
                <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
              )}
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
