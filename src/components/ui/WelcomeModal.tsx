'use client';

import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { AutoAwesome, Toll } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

/**
 * Welcome modal shown once to newly registered users on their very first login.
 *
 * Trigger: `user.onboarding_completed_at` is `null` (set by the backend).
 * No time-windows, no fragile localStorage — the backend is the source of truth.
 *
 * On dismiss:
 * 1. Calls `POST /auth/onboarding-complete` to persist the flag server-side.
 * 2. Dispatches `kh:welcome-dismissed` so AppTour + CreditsWidget can react.
 */
export default function WelcomeModal() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // The SOLE condition: backend says onboarding hasn't been completed yet
    if (user.onboarding_completed_at != null) {
      return;
    }

    // Small delay so the dashboard page renders first
    const timer = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  const handleClose = async (): Promise<void> => {
    setOpen(false);

    // Persist on backend (idempotent – safe to fire-and-forget)
    authService.completeOnboarding().catch(() => {});

    // Refresh user state so subsequent checks see onboarding_completed_at set
    refreshUser().catch(() => {});

    // Signal AppTour & CreditsWidget
    window.dispatchEvent(new CustomEvent('kh:welcome-dismissed'));
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
