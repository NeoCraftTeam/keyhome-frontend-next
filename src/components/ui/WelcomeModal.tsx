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
import { useCallback, useEffect, useRef, useState } from 'react';
import { APPTOUR_SHOWN_KEY } from './AppTour';
import { brand, gradient } from '@/theme/tokens';

/** ms to wait after AppTour completion before opening this modal. */
const WELCOME_DELAY_MS = 3 * 60 * 1000; // 3 minutes
/** ms to wait after this modal closes before showing PushPrompt. */
const PUSH_DELAY_MS = 3 * 1000; // 3 seconds
/** localStorage key that stores the unix timestamp when the tour was completed. */
const TOUR_TS_KEY = 'kh_tour_completed_at';

/**
 * Welcome modal shown once to newly registered customers 3 minutes after they finish AppTour.
 *
 * Sequence:
 *   AppTour close → kh:tour-completed → [3 min] → WelcomeModal opens
 *   WelcomeModal close → [3 s] → kh:welcome-dismissed → PushPrompt appears
 *   PushPrompt close → kh:push-prompt-done → Survey unlocks
 *
 * The 3-minute countdown is persisted in localStorage so it survives
 * page navigation while the user is still in the dashboard.
 *
 * On dismiss:
 * 1. Calls `POST /auth/onboarding-complete` to set onboarding_completed_at server-side.
 * 2. Calls refreshUser() to sync client state.
 * 3. After PUSH_DELAY_MS dispatches `kh:welcome-dismissed` to trigger PushPrompt.
 */
export default function WelcomeModal() {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const hasShown = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  /** Schedule the modal to open after `delayMs`. Clears any previous pending timer. */
  const scheduleOpen = useCallback((delayMs: number) => {
    if (hasShown.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (hasShown.current) return;
      // If onboarding was already completed (e.g. race condition), don't show again.
      if (userRef.current?.onboarding_completed_at != null) {
        if (typeof window !== 'undefined') localStorage.removeItem(TOUR_TS_KEY);
        return;
      }
      hasShown.current = true;
      if (typeof window !== 'undefined') localStorage.removeItem(TOUR_TS_KEY);
      setOpen(true);
    }, delayMs);
  }, []);

  // On mount: resume any pending countdown (user navigated away and came back)
  useEffect(() => {
    if (hasShown.current || typeof window === 'undefined') return;
    const ts = localStorage.getItem(TOUR_TS_KEY);
    if (ts) {
      const elapsed = Date.now() - parseInt(ts, 10);
      scheduleOpen(Math.max(0, WELCOME_DELAY_MS - elapsed));
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scheduleOpen]);

  // Cancel any pending timer if onboarding is already completed.
  // This handles stale TOUR_TS_KEY left in localStorage after the full flow finishes.
  useEffect(() => {
    if (user?.onboarding_completed_at == null) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (typeof window !== 'undefined') localStorage.removeItem(TOUR_TS_KEY);
  }, [user?.onboarding_completed_at]);

  // Listen for fresh tour-completed events
  useEffect(() => {
    const handleTourCompleted = () => {
      if (hasShown.current) return;
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOUR_TS_KEY, String(Date.now()));
      }
      scheduleOpen(WELCOME_DELAY_MS);
    };
    window.addEventListener('kh:tour-completed', handleTourCompleted);
    return () => window.removeEventListener('kh:tour-completed', handleTourCompleted);
  }, [scheduleOpen]);

  const handleClose = async (): Promise<void> => {
    setOpen(false);

    // Clear the tour-shown flag now that the full onboarding sequence is done.
    if (typeof window !== 'undefined') localStorage.removeItem(APPTOUR_SHOWN_KEY);

    // Persist onboarding completion on backend (idempotent)
    authService.completeOnboarding().catch(() => {});

    // Refresh user state so subsequent checks see onboarding_completed_at set
    refreshUser().catch(() => {});

    // Wait 3 s before signalling PushPrompt so modals never stack
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('kh:welcome-dismissed'));
    }, PUSH_DELAY_MS);
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
          m: { xs: 2, sm: 'auto' },
        },
      }}
    >
      {/* Header gradient */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 60%, #A01030 100%)`,
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
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
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
            background: gradient.primary,
            '&:hover': { background: gradient.primaryHover },
          }}
        >
          C&apos;est parti !
        </Button>
      </Box>
    </Dialog>
  );
}
