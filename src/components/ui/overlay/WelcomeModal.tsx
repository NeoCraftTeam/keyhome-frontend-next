'use client';

import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { brand, gradient, semantic } from '@/theme/tokens';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import NotificationsActive from '@mui/icons-material/NotificationsActive';
import Search from '@mui/icons-material/Search';
import Toll from '@mui/icons-material/Toll';
import { Box, Button, Dialog, LinearProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

/** ms to wait after AppTour completion before opening this modal. */
const WELCOME_DELAY_MS = 3 * 60 * 1000; // 3 minutes
/** ms to wait after this modal closes before showing PushPrompt. */
const PUSH_DELAY_MS = 3 * 1000; // 3 seconds
/** localStorage key that stores the unix timestamp when the tour was completed. */
const TOUR_TS_KEY = 'kh_tour_completed_at';
/** localStorage key set while the modal is open. On refresh, the modal reopens immediately
 * instead of losing the user mid-onboarding. Cleared by finalize(). */
const WELCOME_OPEN_KEY = 'kh_welcome_open';

const TOTAL_STEPS = 3;

interface StepConfig {
  Icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle: string;
  body: string;
  cta: string;
  skip: string;
}

function getSteps(bonusCredits: number): StepConfig[] {
  return [
    {
      Icon: Toll,
      iconColor: brand.primary,
      title: 'Bienvenue sur KeyHome !',
      subtitle: `${bonusCredits} crédits offerts`,
      body: 'Utilisez vos crédits pour déverrouiller les coordonnées des annonceurs et contacter les propriétaires directement.',
      cta: 'Suivant →',
      skip: 'Passer',
    },
    {
      Icon: Search,
      iconColor: semantic.purple,
      title: 'Recherche intelligente',
      subtitle: 'Décrivez ce que vous cherchez',
      body: 'Tapez simplement « appartement 3 pièces à Bastos avec parking » et notre IA comprend votre besoin pour vous trouver les meilleures offres.',
      cta: 'Essayer la recherche',
      skip: 'Plus tard',
    },
    {
      Icon: NotificationsActive,
      iconColor: semantic.successBright,
      title: 'Ne ratez aucune annonce',
      subtitle: 'Alertes personnalisées',
      body: "Sauvegardez vos critères et recevez une notification dès qu'un nouveau bien correspondant est publié — par push ou par email.",
      cta: 'Créer une alerte',
      skip: 'Terminer',
    },
  ];
}

/**
 * Welcome wizard shown once to newly registered customers 3 minutes after they finish AppTour.
 *
 * Sequence:
 *   AppTour close → kh:tour-completed → [3 min] → WelcomeModal opens (3-step wizard)
 *   WelcomeModal close → [3 s] → kh:welcome-dismissed → PushPrompt appears
 *   PushPrompt close → kh:push-prompt-done → Survey unlocks
 */
export default function WelcomeModal() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<1 | -1>(1);
  const hasShown = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const bonusCredits = Math.max(user?.point_balance ?? 0, 5);
  const steps = getSteps(bonusCredits);
  const currentStep = steps[step];

  const finalize = useCallback((): void => {
    setOpen(false);
    setStep(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOUR_TS_KEY);
      localStorage.removeItem(WELCOME_OPEN_KEY);
    }
    authService.completeOnboarding().catch(() => {});
    refreshUser().catch(() => {});
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('kh:welcome-dismissed'));
    }, PUSH_DELAY_MS);
  }, [refreshUser]);

  const handleCta = useCallback((): void => {
    if (step === 1) {
      finalize();
      router.push('/search');
      return;
    }
    if (step === 2) {
      finalize();
      router.push('/search-alerts');
      return;
    }
    setAnimDir(1);
    setStep((s) => s + 1);
  }, [step, finalize, router]);

  const handleSkip = useCallback((): void => {
    if (step < TOTAL_STEPS - 1) {
      setAnimDir(1);
      setStep((s) => s + 1);
    } else {
      finalize();
    }
  }, [step, finalize]);

  /** Schedule the modal to open after `delayMs`. */
  const scheduleOpen = useCallback((delayMs: number) => {
    if (hasShown.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (hasShown.current) return;
      if (userRef.current?.onboarding_completed_at != null) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOUR_TS_KEY);
          localStorage.removeItem(WELCOME_OPEN_KEY);
        }
        return;
      }
      hasShown.current = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(WELCOME_OPEN_KEY, '1');
      }
      setOpen(true);
    }, delayMs);
  }, []);

  useEffect(() => {
    if (hasShown.current || typeof window === 'undefined') return;
    const ts = localStorage.getItem(TOUR_TS_KEY);
    if (ts) {
      const elapsed = Date.now() - parseInt(ts, 10);
      scheduleOpen(Math.max(0, WELCOME_DELAY_MS - elapsed));
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleOpen]);

  // Reopen immediately if a page refresh happened while the modal was open.
  // WELCOME_OPEN_KEY is set when the modal opens and cleared only in finalize().
  useEffect(() => {
    if (hasShown.current || typeof window === 'undefined') return;
    if (!localStorage.getItem(WELCOME_OPEN_KEY)) return;
    if (!user) return; // wait until auth resolves
    if (user.onboarding_completed_at != null) {
      localStorage.removeItem(WELCOME_OPEN_KEY);
      localStorage.removeItem(TOUR_TS_KEY);
      return;
    }
    hasShown.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(true);
  }, [user]);

  useEffect(() => {
    if (user?.onboarding_completed_at == null) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOUR_TS_KEY);
      localStorage.removeItem(WELCOME_OPEN_KEY);
    }
  }, [user?.onboarding_completed_at]);

  useEffect(() => {
    const handleTourCompleted = () => {
      if (hasShown.current) return;
      if (typeof window !== 'undefined')
        localStorage.setItem(TOUR_TS_KEY, String(Date.now()));
      scheduleOpen(WELCOME_DELAY_MS);
    };
    window.addEventListener('kh:tour-completed', handleTourCompleted);
    return () =>
      window.removeEventListener('kh:tour-completed', handleTourCompleted);
  }, [scheduleOpen]);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <Dialog
      open={open}
      onClose={finalize}
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
      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 3,
          bgcolor: 'rgba(246,71,95,0.12)',
          '& .MuiLinearProgress-bar': {
            bgcolor: brand.primary,
            transition: 'transform 0.4s ease',
          },
        }}
      />

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
          key={`icon-${step}`}
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
              '0%, 100%': {
                transform: 'scale(1)',
                boxShadow: '0 0 0 0 rgba(255,255,255,0.2)',
              },
              '50%': {
                transform: 'scale(1.05)',
                boxShadow: '0 0 0 12px rgba(255,255,255,0)',
              },
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <currentStep.Icon sx={{ fontSize: 32, color: '#fff' }} />
        </Box>

        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ color: '#fff', mb: 0.5 }}
        >
          {currentStep.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}
        >
          {currentStep.subtitle}
        </Typography>
      </Box>

      {/* Body */}
      <Box
        key={`body-${step}`}
        sx={{
          px: 3,
          py: 3,
          animation: 'stepFadeIn 0.3s ease both',
          '@keyframes stepFadeIn': {
            from: { opacity: 0, transform: `translateX(${animDir * 24}px)` },
            to: { opacity: 1, transform: 'translateX(0)' },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {step === 0 && (
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
            <AutoAwesome sx={{ fontSize: 24, color: 'primary.main' }} />
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                color="primary.main"
                sx={{ lineHeight: 1 }}
              >
                {bonusCredits}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                crédits offerts
              </Typography>
            </Box>
          </Box>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, lineHeight: 1.7 }}
        >
          {currentStep.body}
        </Typography>

        {/* Step dots */}
        <Box
          sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mb: 2.5 }}
        >
          {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
            <Box
              key={idx}
              sx={{
                width: idx === step ? 20 : 8,
                height: 8,
                borderRadius: 4,
                transition: 'all 0.3s ease',
                bgcolor: idx === step ? 'primary.main' : 'divider',
              }}
            />
          ))}
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleCta}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '1rem',
            background: gradient.primary,
            '&:hover': { background: gradient.primaryHover },
            mb: 1,
          }}
        >
          {currentStep.cta}
        </Button>

        <Button
          fullWidth
          variant="text"
          size="small"
          onClick={handleSkip}
          sx={{ color: 'text.secondary', fontSize: '0.85rem' }}
        >
          {currentStep.skip}
        </Button>
      </Box>
    </Dialog>
  );
}
