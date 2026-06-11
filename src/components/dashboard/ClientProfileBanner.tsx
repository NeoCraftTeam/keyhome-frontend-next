'use client';

import { useAuth } from '@/providers/AuthProvider';
import AvatarIcon from '@mui/icons-material/AccountCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CityIcon from '@mui/icons-material/LocationCity';
import PhoneIcon from '@mui/icons-material/Phone';
import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import { Button } from '@/components/ui/forms/Button';
import { Typography } from '@/components/ui/typography/Typography';
import { brand } from '@/theme/tokens';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'kh_profile_banner_dismissed_until';
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  const until = localStorage.getItem(DISMISS_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

function dismiss(): void {
  const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(DISMISS_KEY, String(until));
}

export default function ClientProfileBanner() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isDismissed());
  }, []);

  if (!isAuthenticated || !user) return null;

  const steps = [
    {
      key: 'avatar',
      label: 'Photo',
      done: !!user.avatar,
      icon: <AvatarIcon sx={{ fontSize: 13 }} />,
    },
    {
      key: 'phone',
      label: 'Téléphone',
      done: !!user.phone_number,
      icon: <PhoneIcon sx={{ fontSize: 13 }} />,
    },
    {
      key: 'city',
      label: 'Ville',
      done: !!user.city_id,
      icon: <CityIcon sx={{ fontSize: 13 }} />,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  if (progress === 100) return null;

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  // Single source of truth for the banner's corner radius so the outer
  // Box and the inner ::before accent bar stay locked even when the
  // visual is later re-tuned.
  const BANNER_RADIUS = 14;

  return (
    <Collapse in={visible} unmountOnExit>
      <Box
        role="status"
        aria-label="Progression du profil"
        sx={{
          position: 'relative',
          borderRadius: `${BANNER_RADIUS}px`,
          border: '1px solid',
          borderColor: (t) =>
            t.palette.mode === 'dark'
              ? 'rgba(246,71,95,0.22)'
              : 'rgba(246,71,95,0.18)',
          bgcolor: (t) =>
            t.palette.mode === 'dark'
              ? 'rgba(246,71,95,0.06)'
              : 'rgba(246,71,95,0.03)',
          overflow: 'hidden',
          /* left accent bar */
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: `linear-gradient(180deg, ${brand.primary} 0%, #ff8c42 100%)`,
            borderRadius: `${BANNER_RADIUS}px 0 0 ${BANNER_RADIUS}px`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.5, md: 2.5 },
            pl: { xs: 2.5, md: 3 },
            pr: { xs: 5, md: 2 },
            py: { xs: 1.75, md: 2 },
          }}
        >
          {/* ── Content ── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ mb: 0.25, lineHeight: 1.3 }}
            >
              Complétez votre profil
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1.25, fontSize: '0.72rem' }}
            >
              Ajoutez vos informations pour booster votre visibilité
            </Typography>

            {/* Step chips */}
            <Stack
              direction="row"
              spacing={0.75}
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 1.75 }}
            >
              {steps.map((step) => (
                <Chip
                  key={step.key}
                  size="small"
                  icon={
                    step.done ? (
                      <CheckCircleIcon sx={{ fontSize: 13 }} />
                    ) : (
                      step.icon
                    )
                  }
                  label={step.label}
                  sx={{
                    height: 26,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '1px solid',
                    ...(step.done
                      ? {
                          bgcolor: (t) =>
                            t.palette.mode === 'dark'
                              ? 'rgba(22,163,74,0.14)'
                              : 'rgba(22,163,74,0.09)',
                          color: 'success.main',
                          borderColor: 'rgba(22,163,74,0.3)',
                          '& .MuiChip-icon': { color: 'success.main' },
                        }
                      : {
                          bgcolor: (t) =>
                            t.palette.mode === 'dark'
                              ? 'rgba(246,71,95,0.16)'
                              : 'rgba(246,71,95,0.08)',
                          color: 'primary.main',
                          borderColor: 'rgba(246,71,95,0.28)',
                          '& .MuiChip-icon': { color: 'primary.main' },
                        }),
                  }}
                />
              ))}
            </Stack>

            {/* Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => router.push('/profile')}
                sx={{
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  px: 2,
                  py: 0.6,
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(246,71,95,0.35)',
                  textTransform: 'none',
                }}
              >
                Compléter
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={handleDismiss}
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                Plus tard
              </Button>
            </Box>
          </Box>

          {/* ── Circular progress gauge ── */}
          <Box
            sx={{
              position: 'relative',
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              width: 64,
              height: 64,
            }}
          >
            {/* track */}
            <CircularProgress
              variant="determinate"
              value={100}
              size={60}
              thickness={4}
              sx={{
                position: 'absolute',
                color: (t) =>
                  t.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.08)',
              }}
            />
            {/* fill */}
            <CircularProgress
              variant="determinate"
              value={progress}
              size={60}
              thickness={4}
              sx={{
                position: 'absolute',
                color: 'primary.main',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{
                color: 'primary.main',
                fontSize: '0.875rem',
                lineHeight: 1,
              }}
            >
              {progress}%
            </Typography>
          </Box>
        </Box>

        {/* Close button */}
        <Tooltip title="Ignorer (7 jours)">
          <IconButton
            size="small"
            onClick={handleDismiss}
            aria-label="Ignorer"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'text.disabled',
              '&:hover': { color: 'text.secondary' },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Collapse>
  );
}
