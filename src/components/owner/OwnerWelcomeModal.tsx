'use client';

import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { Apartment, BarChart, CalendarMonth } from '@mui/icons-material';
import { Box, Button, Dialog, LinearProgress, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APPTOUR_SHOWN_KEY } from '@/components/ui/AppTour';
import { brandAgent } from '@/theme/tokens';

/** ms to wait after AppTour completion before opening this modal.
 * Short breathing-room so the tour close animation finishes before the wizard slides in. */
const WELCOME_DELAY_MS = 1000;
/** ms to wait after this modal closes before showing PushPrompt. */
const PUSH_DELAY_MS = 3 * 1000; // 3 seconds
/** localStorage key that stores the unix timestamp when the tour was completed. */
const TOUR_TS_KEY = 'kh_owner_tour_completed_at';

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

const OWNER_STEPS: StepConfig[] = [
  {
    Icon: Apartment,
    iconColor: brandAgent.primary,
    title: 'Bienvenue sur KeyHome Pro !',
    subtitle: 'Votre espace propriétaire',
    body: 'Gérez vos annonces, suivez vos performances et trouvez rapidement des locataires qualifiés pour vos biens.',
    cta: 'Suivant →',
    skip: 'Passer',
  },
  {
    Icon: BarChart,
    iconColor: brandAgent.secondary,
    title: 'Statistiques détaillées',
    subtitle: 'Suivez vos performances',
    body: "Consultez les vues, favoris et taux d'engagement de vos annonces. Identifiez les biens qui attirent le plus d'intérêt.",
    cta: 'Voir le dashboard',
    skip: 'Plus tard',
  },
  {
    Icon: CalendarMonth,
    iconColor: brandAgent.accent,
    title: 'Gérez vos visites',
    subtitle: 'Planification simplifiée',
    body: 'Recevez des demandes de visite, gérez votre agenda et communiquez facilement avec vos futurs locataires.',
    cta: 'Voir les visites',
    skip: 'Terminer',
  },
];

/**
 * Welcome wizard shown once to newly registered owners 3 minutes after they finish AppTour.
 *
 * Sequence:
 *   AppTour close → kh:tour-completed → [3 min] → OwnerWelcomeModal opens (3-step wizard)
 *   OwnerWelcomeModal close → [3 s] → kh:welcome-dismissed → PushPrompt appears
 *   PushPrompt close → kh:push-prompt-done → Survey unlocks
 */
export default function OwnerWelcomeModal() {
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

  const currentStep = OWNER_STEPS[step];

  const finalize = useCallback((): void => {
    setOpen(false);
    setStep(0);
    if (typeof window !== 'undefined')
      localStorage.removeItem(APPTOUR_SHOWN_KEY);
    authService.completeOnboarding().catch(() => {});
    refreshUser().catch(() => {});
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('kh:welcome-dismissed'));
    }, PUSH_DELAY_MS);
  }, [refreshUser]);

  const handleCta = useCallback((): void => {
    if (step === 1) {
      finalize();
      router.push('/owner/dashboard');
      return;
    }
    if (step === 2) {
      finalize();
      router.push('/owner/viewings');
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
        if (typeof window !== 'undefined') localStorage.removeItem(TOUR_TS_KEY);
        return;
      }
      hasShown.current = true;
      if (typeof window !== 'undefined') localStorage.removeItem(TOUR_TS_KEY);
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

  useEffect(() => {
    if (user?.onboarding_completed_at == null) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (typeof window !== 'undefined') localStorage.removeItem(TOUR_TS_KEY);
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
      onClose={() => {}}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        },
      }}
    >
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            bgcolor: brandAgent.primary,
          },
        }}
      />
      <Box
        key={step}
        sx={{
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          animation: `kh-step-slide-${animDir > 0 ? 'in' : 'back'} 0.35s ease both`,
          '@keyframes kh-step-slide-in': {
            '0%': { opacity: 0, transform: 'translateX(24px)' },
            '100%': { opacity: 1, transform: 'translateX(0)' },
          },
          '@keyframes kh-step-slide-back': {
            '0%': { opacity: 0, transform: 'translateX(-24px)' },
            '100%': { opacity: 1, transform: 'translateX(0)' },
          },
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: `${currentStep.iconColor}14`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2.5,
          }}
        >
          <currentStep.Icon
            sx={{ fontSize: 36, color: currentStep.iconColor }}
          />
        </Box>

        <Typography variant="h5" fontWeight={800} gutterBottom>
          {currentStep.title}
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ color: currentStep.iconColor, fontWeight: 700, mb: 1.5 }}
        >
          {currentStep.subtitle}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, lineHeight: 1.6 }}
        >
          {currentStep.body}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleCta}
            sx={{
              py: 1.5,
              fontWeight: 700,
              borderRadius: 3,
              bgcolor: brandAgent.primary,
              '&:hover': { bgcolor: brandAgent.primaryDark },
            }}
          >
            {currentStep.cta}
          </Button>
          <Button
            variant="text"
            fullWidth
            onClick={handleSkip}
            sx={{
              fontWeight: 600,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {currentStep.skip}
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ mt: 2, display: 'block' }}
        >
          Étape {step + 1} / {TOTAL_STEPS}
        </Typography>
      </Box>
    </Dialog>
  );
}
