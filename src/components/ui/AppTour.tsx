'use client';

import { authService } from '@/services/auth.service';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/types';
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowForward,
  ArrowBack,
  MapsHomeWork,
  AutoAwesome,
  CompareArrows,
  Calculate,
  Notifications,
  LockOpenRounded,
  FavoriteBorderRounded,
  Dashboard as DashboardIcon,
  BarChart,
  RateReview,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import { brand } from '@/theme/tokens';

/** localStorage key set when AppTour closes for a client user.
 * Prevents the tour from reopening on refresh while WelcomeModal countdown is running. */
export const APPTOUR_SHOWN_KEY = 'kh_apptour_shown';

interface TourStep {
  Icon: SvgIconComponent;
  title: string;
  description: string;
  color: string;
  badge?: string;
  highlight?: string;
  demo?: React.ReactNode;
}

const STEPS: TourStep[] = [
  {
    Icon: MapsHomeWork,
    title: 'Bienvenue sur KeyHome',
    description:
      "Trouvez votre logement idéal parmi des milliers d'annonces vérifiées.",
    color: brand.primary,
    highlight: 'Nouvelle version',
  },
  {
    Icon: AutoAwesome,
    title: 'Recherche par IA ',
    description:
      'Décrivez ce que vous cherchez en langage naturel. Notre IA comprend et filtre automatiquement les annonces pour vous.',
    color: '#6c5ce7',
    badge: 'Nouveau',
    highlight: '"Appartement 3 pièces à Bastos moins de 150k avec parking"',
  },
  {
    Icon: CompareArrows,
    title: 'Comparez les biens côte à côte',
    description:
      'Sélectionnez jusqu\'à 3 annonces et comparez prix, surface, équipements et plus en un seul coup d\'œil.',
    color: '#0984e3',
    badge: 'Nouveau',
    highlight: 'Prix · Surface · Chambres · Équipements · Prix/m²',
  },
  {
    Icon: Calculate,
    title: 'Estimez le loyer du marché',
    description:
      'Découvrez la fourchette de loyer réelle pour un bien selon la ville, le type et la surface. Basé sur des annonces réelles.',
    color: '#e17055',
    badge: 'Nouveau',
    highlight: 'Prix bas · Prix médian · Prix haut',
  },
  {
    Icon: Notifications,
    title: 'Alertes de recherche',
    description:
      'Sauvegardez vos critères de recherche. Recevez une notification dès qu\'une nouvelle annonce correspondante est publiée.',
    color: '#00b894',
    badge: 'Nouveau',
    highlight: 'Notification push + email automatique',
  },
  {
    Icon: FavoriteBorderRounded,
    title: 'Favoris & suivi',
    description:
      "Sauvegardez les annonces qui vous intéressent d'un simple clic. Retrouvez-les à tout moment dans votre profil.",
    color: '#e84393',
  },
  {
    Icon: LockOpenRounded,
    title: 'Débloquez les contacts',
    description:
      "Utilisez vos crédits pour accéder au numéro de téléphone, email et WhatsApp de l'annonceur et le contacter directement.",
    color: '#2d3436',
    highlight: '1 déverrouillage = accès complet à l\'annonceur',
  },
];

const OWNER_STEPS: TourStep[] = [
  {
    Icon: DashboardIcon,
    title: 'Bienvenue dans votre espace bailleur',
    description:
      'Publiez vos annonces, suivez les statistiques et gérez vos visites depuis un tableau de bord dédié.',
    color: '#14b8a6',
    highlight: 'Teal · interface pensée pour les pros',
  },
  {
    Icon: BarChart,
    title: 'Suivez vos performances',
    description:
      'Visualisez les vues, favoris et tendances sur vos biens pour ajuster votre stratégie de mise en ligne.',
    color: '#0d9488',
    badge: 'Analytics',
  },
  {
    Icon: Notifications,
    title: 'Restez réactif',
    description:
      'Notifications pour les visites, messages et actions importantes sur vos annonces.',
    color: '#0f766e',
  },
  {
    Icon: RateReview,
    title: 'Votre réputation',
    description:
      'Les avis locataires renforcent la confiance : encouragez les retours après une location réussie.',
    color: '#115e59',
  },
];

interface AppTourProps {
  onDone?: () => void;
  /** Parcours client (défaut) ou bailleur (dashboard propriétaire). */
  variant?: 'client' | 'owner';
}

export default function AppTour({ onDone, variant = 'client' }: AppTourProps) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');
  const openedRef = useRef(false);

  const steps = variant === 'owner' ? OWNER_STEPS : STEPS;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }
    if (user.onboarding_completed_at != null) {
      return;
    }

    // Tour was already completed this session (WelcomeModal countdown may still be running).
    // Prevent the tour from looping on refresh before onboarding_completed_at is persisted.
    if (variant === 'client' && typeof window !== 'undefined' && localStorage.getItem(APPTOUR_SHOWN_KEY)) {
      return;
    }

    if (variant === 'owner') {
      const allowed = user.role === UserRole.AGENT || user.role === UserRole.ADMIN;
      if (!allowed) {
        return;
      }
    } else {
      if (user.role !== UserRole.CUSTOMER) {
        return;
      }
    }

    const tryOpen = () => {
      if (openedRef.current) {
        return;
      }
      openedRef.current = true;
      window.setTimeout(() => setOpen(true), 600);
    };

    // Both variants open directly — for client, WelcomeModal (credits) fires AFTER the tour closes
    const t = window.setTimeout(() => tryOpen(), 800);
    return () => window.clearTimeout(t);
  }, [isAuthenticated, user, variant]);

  const handleClose = () => {
    setOpen(false);
    onDone?.();
    if (variant === 'client') {
      // Mark tour as shown so refresh doesn't reopen it during WelcomeModal countdown.
      if (typeof window !== 'undefined') localStorage.setItem(APPTOUR_SHOWN_KEY, '1');
      // Signal WelcomeModal to start its 3-minute countdown.
      window.dispatchEvent(new CustomEvent('kh:tour-completed'));
    } else {
      // Owner flow: no WelcomeModal, so complete onboarding immediately.
      authService.completeOnboarding()
        .then(() => refreshUser())
        .catch(() => { /* ignore */ });
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setAnimDir('forward');
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    setAnimDir('back');
    setStep((s) => Math.max(0, s - 1));
  };

  if (!open) { return null; }

  const current = steps[step];
  const { Icon: StepIcon } = current;
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

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
          boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
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
          bgcolor: 'grey.100',
          '& .MuiLinearProgress-bar': {
            bgcolor: current.color,
            transition: 'background-color 0.4s ease',
          },
        }}
      />

      {/* Colored hero */}
      <Box
        key={step}
        sx={{
          height: { xs: 170, sm: 210 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(145deg, ${current.color}ee 0%, ${current.color}bb 100%)`,
          animation: animDir === 'forward'
            ? 'slideInRight 0.32s cubic-bezier(0.22,1,0.36,1) both'
            : 'slideInLeft 0.32s cubic-bezier(0.22,1,0.36,1) both',
          '@keyframes slideInRight': {
            from: { opacity: 0, transform: 'translateX(30px)' },
            to: { opacity: 1, transform: 'none' },
          },
          '@keyframes slideInLeft': {
            from: { opacity: 0, transform: 'translateX(-30px)' },
            to: { opacity: 1, transform: 'none' },
          },
        }}
      >
        {/* Deco circles */}
        <Box sx={{
          position: 'absolute', width: { xs: 160, sm: 220 }, height: { xs: 160, sm: 220 }, borderRadius: '50%',
          border: { xs: '30px solid rgba(255,255,255,0.07)', sm: '44px solid rgba(255,255,255,0.07)' }, top: -70, right: -70,
        }} />
        <Box sx={{
          position: 'absolute', width: { xs: 90, sm: 130 }, height: { xs: 90, sm: 130 }, borderRadius: '50%',
          border: { xs: '20px solid rgba(255,255,255,0.05)', sm: '28px solid rgba(255,255,255,0.05)' }, bottom: -35, left: -35,
        }} />
        <Box sx={{
          position: 'absolute', width: { xs: 60, sm: 80 }, height: { xs: 60, sm: 80 }, borderRadius: '50%',
          border: '18px solid rgba(255,255,255,0.07)', top: 20, left: '20%',
          display: { xs: 'none', sm: 'block' },
        }} />

        {/* Badge */}
        {current.badge && (
          <Chip
            label={current.badge}
            size="small"
            sx={{
              position: 'absolute', top: 16, left: 16,
              bgcolor: 'rgba(255,255,255,0.25)',
              color: 'white', fontWeight: 700, fontSize: 11,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          />
        )}

        {/* Close */}
        <IconButton
          onClick={handleClose}
          size="small"
          aria-label="Fermer le tutoriel"
          sx={{
            position: 'absolute', top: 12, right: 12,
            bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>

        {/* Icon */}
        <Box
          sx={{
            width: { xs: 64, sm: 88 }, height: { xs: 64, sm: 88 }, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            animation: 'iconBounce 0.45s cubic-bezier(0.22,1,0.36,1)',
            '@keyframes iconBounce': {
              from: { opacity: 0, transform: 'scale(0.55) translateY(16px)' },
              to: { opacity: 1, transform: 'scale(1) translateY(0)' },
            },
          }}
        >
          <StepIcon sx={{ fontSize: { xs: 32, sm: 44 }, color: '#fff' }} />
        </Box>

        {/* Step count */}
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.7)', mt: 1.5, fontWeight: 600, fontSize: 11 }}
        >
          {step + 1} / {steps.length}
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3.5, pb: 3.5, pt: 2.5 }}>
        {/* Dots */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 2.5 }}>
          {steps.map((_, i) => (
            <Box
              key={i}
              onClick={() => { setAnimDir(i > step ? 'forward' : 'back'); setStep(i); }}
              sx={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 3,
                bgcolor: i === step ? current.color : i < step ? `${current.color}55` : 'grey.200',
                cursor: 'pointer',
                transition: 'all 0.35s ease',
              }}
            />
          ))}
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          fontWeight={800}
          textAlign="center"
          gutterBottom
          sx={{
            fontSize: '1.1rem',
            animation: 'fadeUp 0.3s ease both',
            '@keyframes fadeUp': {
              from: { opacity: 0, transform: 'translateY(10px)' },
              to: { opacity: 1, transform: 'none' },
            },
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
            animation: 'fadeUp 0.35s ease 0.05s both',
            '@keyframes fadeUp': {
              from: { opacity: 0, transform: 'translateY(10px)' },
              to: { opacity: 1, transform: 'none' },
            },
          }}
        >
          {current.description}
        </Typography>

        {/* Highlight chip */}
        {current.highlight && (
          <Box
            sx={{
              mt: 1.75,
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: `${current.color}12`,
              border: `1px solid ${current.color}30`,
              textAlign: 'center',
              animation: 'fadeUp 0.4s ease 0.1s both',
              '@keyframes fadeUp': {
                from: { opacity: 0, transform: 'translateY(10px)' },
                to: { opacity: 1, transform: 'none' },
              },
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ color: current.color, fontSize: 11.5, wordBreak: 'break-word' }}
            >
              {current.highlight}
            </Typography>
          </Box>
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: 3 }}>
          {step > 0 ? (
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: 2.5, textTransform: 'none', fontWeight: 600,
                flex: '0 0 auto', borderColor: 'divider', color: 'text.secondary',
                '&:hover': { borderColor: 'text.secondary' },
              }}
            >
              Retour
            </Button>
          ) : (
            <Button
              variant="text"
              onClick={handleClose}
              sx={{ borderRadius: 2.5, textTransform: 'none', color: 'text.disabled', flex: '0 0 auto' }}
            >
              Passer
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={!isLast && <ArrowForward sx={{ fontSize: 16 }} />}
            fullWidth
            sx={{
              borderRadius: 2.5, py: 1.25,
              textTransform: 'none', fontWeight: 700,
              bgcolor: current.color,
              '&:hover': { bgcolor: current.color, filter: 'brightness(0.88)' },
              transition: 'background-color 0.4s ease',
              boxShadow: `0 4px 20px ${current.color}44`,
            }}
          >
            {isLast ? "C'est parti " : 'Suivant'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
