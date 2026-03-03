'use client';

import CreditsWidget from '@/components/layout/CreditsWidget';
import { useAuth } from '@/providers/AuthProvider';
import { ArrowBack, PersonOutline } from '@mui/icons-material';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdsTopBar() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        px: { xs: 2, sm: 3 },
        height: 56,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        bgcolor: 'rgba(255,255,255,0.88)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Left: back + logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => router.back()}
          aria-label="Retour"
          sx={{ color: 'text.secondary' }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
        <Link href="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{ color: 'primary.main', letterSpacing: -0.5, lineHeight: 1 }}
          >
            🔑 KeyHome
          </Typography>
        </Link>
      </Box>

      {/* Right: credits + profile */}
      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {isAuthenticated && <CreditsWidget />}
        {isAuthenticated && user ? (
          <Link href="/profile" style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={user.avatar || undefined}
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'primary.main',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'divider',
                transition: 'border-color 0.18s',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </Avatar>
          </Link>
        ) : !isAuthenticated ? (
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '40px',
                px: 1.5,
                py: 0.5,
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <PersonOutline sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Connexion
              </Typography>
            </Box>
          </Link>
        ) : null}
      </Box>
    </Box>
  );
}
