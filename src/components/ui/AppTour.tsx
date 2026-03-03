'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowForward,
  ArrowBack,
  MapsHomeWork,
  SearchRounded,
  FavoriteBorderRounded,
  LockOpenRounded,
  PersonRounded,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

const TOUR_KEY = 'keyhome_tour_v1_done';

interface TourStep {
  Icon: SvgIconComponent;
  title: string;
  description: string;
  color: string;
}

const STEPS: TourStep[] = [
  {
    Icon: MapsHomeWork,
    title: 'Bienvenue sur KeyHome',
    description: "La plateforme immobilière N°1 en Afrique. Trouvez votre logement idéal parmi des milliers d'annonces vérifiées.",
    color: '#F6475F',
  },
  {
    Icon: SearchRounded,
    title: 'Recherchez en quelques clics',
    description: 'Utilisez la barre de recherche pour filtrer par ville, type de bien, fourchette de prix et bien plus encore.',
    color: '#6c5ce7',
  },
  {
    Icon: FavoriteBorderRounded,
    title: 'Sauvegardez vos favoris',
    description: "Cliquez sur le cœur d'une annonce pour l'ajouter à vos favoris et la retrouver facilement dans votre profil.",
    color: '#e84393',
  },
  {
    Icon: LockOpenRounded,
    title: 'Débloquez les contacts',
    description: "Payez une fois pour accéder au numéro de téléphone et à l'email de l'annonceur et le contacter directement.",
    color: '#00b894',
  },
  {
    Icon: PersonRounded,
    title: 'Complétez votre profil',
    description: 'Ajoutez votre photo, votre ville et vos infos pour une expérience personnalisée. Connectez aussi vos comptes Google / Facebook.',
    color: '#fdcb6e',
  },
];

interface AppTourProps {
  /** Called when the tour is dismissed or completed. */
  onDone?: () => void;
}

export default function AppTour({ onDone }: AppTourProps) {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') { return; }

    // Already completed the tour — nothing to do
    if (localStorage.getItem(TOUR_KEY)) { return; }

    // Only show the tour to "just registered" users (onboarding not yet complete)
    if (!isAuthenticated || !user) { return; }

    // If onboarding already completed, this is NOT a first-login — skip the tour
    if (user.onboarding_completed_at != null) {
      return;
    }

    // Onboarding not completed → WelcomeModal will show first.
    // Wait for the user to dismiss it before activating the tour.
    const handler = () => {
      setTimeout(() => setOpen(true), 600);
      window.removeEventListener('kh:welcome-dismissed', handler);
    };
    window.addEventListener('kh:welcome-dismissed', handler);

    return () => {
      window.removeEventListener('kh:welcome-dismissed', handler);
    };
  }, [isAuthenticated, user]);

  const handleClose = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setOpen(false);
    onDone?.();
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  if (!open) { return null; }

  const current = STEPS[step];
  const { Icon: StepIcon } = current;
  const isLast = step === STEPS.length - 1;

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
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        },
      }}
    >
      {/* Colored header band */}
      <Box
        sx={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${current.color}dd 0%, ${current.color} 100%)`,
          transition: 'background 0.4s ease',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            border: '40px solid rgba(255,255,255,0.08)',
            top: -60,
            right: -60,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '24px solid rgba(255,255,255,0.06)',
            bottom: -30,
            left: -30,
          }}
        />

        {/* MUI Icon */}
        <Box
          sx={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            animation: 'emojiBounce 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            '@keyframes emojiBounce': {
              '0%': { opacity: 0, transform: 'scale(0.5) translateY(20px)' },
              '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
            },
          }}
        >
          <StepIcon sx={{ fontSize: 48, color: '#fff' }} />
        </Box>

        {/* Skip button */}
        <IconButton
          aria-label="Fermer le guide"
          onClick={handleClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 4, pb: 4, pt: 3 }}>
        {/* Step indicator dots */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mb: 3 }}>
          {STEPS.map((_, i) => (
            <Box
              key={i}
              onClick={() => setStep(i)}
              sx={{
                width: i === step ? 20 : 7,
                height: 7,
                borderRadius: '4px',
                bgcolor: i === step ? current.color : 'grey.300',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          fontWeight={700}
          textAlign="center"
          gutterBottom
          sx={{
            animation: 'textIn 0.35s ease',
            '@keyframes textIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
          }}
        >
          {current.title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{
            lineHeight: 1.7,
            mb: 3,
            minHeight: 56,
            animation: 'textIn 0.35s ease 0.05s both',
            '@keyframes textIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
          }}
        >
          {current.description}
        </Typography>

        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {step > 0 ? (
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowBack />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flex: '0 0 auto' }}
            >
              Retour
            </Button>
          ) : (
            <Button
              variant="text"
              onClick={handleClose}
              sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary', flex: '0 0 auto' }}
            >
              Passer
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={!isLast && <ArrowForward />}
            fullWidth
            sx={{
              borderRadius: 2,
              py: 1.25,
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: current.color,
              '&:hover': { bgcolor: current.color, filter: 'brightness(0.9)' },
              transition: 'background-color 0.3s ease',
              boxShadow: `0 4px 18px ${current.color}55`,
            }}
          >
            {isLast ? "C'est parti !" : 'Suivant'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
