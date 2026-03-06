'use client';

import { lightTheme } from '@/theme/theme';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {
  AppBar,
  Box,
  Chip,
  Container,
  ThemeProvider as MuiThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export default function SurveysClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={lightTheme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F7F7F8' }}>
        {/* ── Navbar ── */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar
            sx={{
              maxWidth: 1280,
              width: '100%',
              mx: 'auto',
              px: { xs: 2, md: 4 },
              minHeight: { xs: 56, md: 64 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Logo */}
            <Link href="/surveys" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Image
                src="/images/logo.png"
                alt="KeyHome"
                width={36}
                height={36}
                priority
                style={{ objectFit: 'contain' }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  letterSpacing: '-0.5px',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                }}
              >
                <Box component="span" sx={{ color: 'primary.main' }}>
                  KeyHome
                </Box>
                {' '}
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.85em' }}>
                  Sondages
                </Box>
              </Typography>
            </Link>

            {/* Anonymity badge */}
            <Chip
              icon={<LockOutlinedIcon sx={{ fontSize: '13px !important' }} />}
              label="100% Anonyme"
              size="small"
              sx={{
                bgcolor: '#E8F5E9',
                color: '#2E7D32',
                fontWeight: 600,
                fontSize: '0.7rem',
                border: '1px solid #A5D6A7',
                '& .MuiChip-icon': { color: '#2E7D32' },
              }}
            />
          </Toolbar>
        </AppBar>

        {/* ── Content ── */}
        <Box component="main" sx={{ flex: 1 }}>
          {children}
        </Box>

        {/* ── Footer ── */}
        <Box
          component="footer"
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            py: 4,
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              © {new Date().getFullYear()} KeyHome · Tous droits réservés
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Vos réponses sont collectées de façon entièrement anonyme.
            </Typography>
          </Container>
        </Box>
      </Box>
    </MuiThemeProvider>
  );
}
