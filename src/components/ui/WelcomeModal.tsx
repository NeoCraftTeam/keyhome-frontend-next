'use client';

import { useAuth } from '@/providers/AuthProvider';
import { AutoAwesome, Toll } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'kh_welcome_seen';

/**
 * Welcome modal shown once to newly registered users.
 * Displays a short intro and the welcome bonus credits.
 */
export default function WelcomeModal() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Only show once ever
    const alreadySeen = localStorage.getItem(STORAGE_KEY);
    if (alreadySeen) {
      return;
    }

    // Only show if account is very recent (< 2 minutes old)
    // This avoids showing the modal to existing users who haven't seen it yet
    if (user.created_at) {
      const createdAt = new Date(user.created_at).getTime();
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      if (createdAt < twoMinutesAgo) {
        // Mark as seen so we don't check again
        localStorage.setItem(STORAGE_KEY, 'true');
        return;
      }
    }

    // Small delay so the page loads first
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const bonusCredits = Math.max(user?.point_balance ?? 0, 5);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          textAlign: 'center',
        },
      }}
    >
      {/* Header gradient */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #F6475F 0%, #D93A50 60%, #A01030 100%)',
          pt: 4,
          pb: 3,
          px: 3,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            animation: 'welcomePulse 2s ease-in-out infinite',
            '@keyframes welcomePulse': {
              '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255,255,255,0.2)' },
              '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 12px rgba(255,255,255,0)' },
            },
          }}
        >
          <AutoAwesome sx={{ fontSize: 32, color: '#fff' }} />
        </Box>
        <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', mb: 0.5 }}>
          Bienvenue sur KeyHome !
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 280, mx: 'auto' }}>
          Merci de nous avoir rejoint. Voici un cadeau pour bien démarrer.
        </Typography>
      </Box>

      {/* Body */}
      <Box sx={{ px: 3, py: 3 }}>
        {/* Credits badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'rgba(246, 71, 95, 0.08)',
            borderRadius: 3,
            px: 3,
            py: 1.5,
            mb: 2,
          }}
        >
          <Toll sx={{ fontSize: 28, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ lineHeight: 1 }}>
              {bonusCredits}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
              crédits offerts
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          Utilisez vos crédits pour déverrouiller les coordonnées des annonceurs et accéder aux meilleures offres immobilières.
        </Typography>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleClose}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '1rem',
            background: 'linear-gradient(to right, #F6475F, #D93A50)',
            '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
          }}
        >
          C&apos;est parti !
        </Button>
      </Box>
    </Dialog>
  );
}
