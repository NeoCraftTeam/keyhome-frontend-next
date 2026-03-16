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
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

const TOUR_KEY = 'keyhome_tour_v2_done';

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
    color: '#F6475F',
    highlight: 'Nouvelle version',
  },
  {
    Icon: AutoAwesome,
    title: 'Recherche par IA ✨',
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

interface AppTourProps {
  onDone?: () => void;
}

export default function AppTour({ onDone }: AppTourProps) {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');

  useEffect(() => {
    if (typeof window === 'undefined') { return; }
    try {
      if (localStorage.getItem(TOUR_KEY)) { return; }
    } catch { return; }
    if (!isAuthenticated || !user) { return; }
    if (user.onboarding_completed_at != null) { return; }

    const handler = () => {
      setTimeout(() => setOpen(true), 600);
      window.removeEventListener('kh:welcome-dismissed', handler);
    };
    window.addEventListener('kh:welcome-dismissed', handler);
    return () => { window.removeEventListener('kh:welcome-dismissed', handler); };
  }, [isAuthenticated, user]);

  const handleClose = () => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem(TOUR_KEY, '1');
    } catch { /* localStorage disabled */ }
    setOpen(false);
    onDone?.();
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
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

  const current = STEPS[step];
  const { Icon: StepIcon } = current;
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

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
          {step + 1} / {STEPS.length}
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3.5, pb: 3.5, pt: 2.5 }}>
        {/* Dots */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 2.5 }}>
          {STEPS.map((_, i) => (
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
              sx={{ color: current.color, fontSize: 11.5 }}
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
