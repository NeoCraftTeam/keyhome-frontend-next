'use client';

import { useAuth } from '@/providers/AuthProvider';
import {
  AccountCircle as AvatarIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  LocationCity as CityIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
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
    { key: 'avatar', label: 'Photo', done: !!user.avatar, icon: <AvatarIcon sx={{ fontSize: 14 }} /> },
    { key: 'phone', label: 'Téléphone', done: !!user.phone_number, icon: <PhoneIcon sx={{ fontSize: 14 }} /> },
    { key: 'city', label: 'Ville', done: !!user.city_id, icon: <CityIcon sx={{ fontSize: 14 }} /> },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  if (progress === 100) return null;

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <Collapse in={visible} unmountOnExit>
      <Alert
        severity="info"
        icon={false}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'primary.light',
          bgcolor: 'background.paper',
          px: { xs: 2, md: 3 },
          py: 1.5,
        }}
        action={
          <Tooltip title="Ignorer (7 jours)">
            <IconButton size="small" onClick={handleDismiss} aria-label="Ignorer">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                Complétez votre profil
              </Typography>
              <Typography variant="caption" fontWeight={700} color="primary.main">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 4, borderRadius: 2, mb: 1, maxWidth: 280 }}
            />
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {steps.map((step) => (
                <Chip
                  key={step.key}
                  size="small"
                  icon={step.done ? <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} /> : step.icon}
                  label={step.label}
                  variant={step.done ? 'outlined' : 'filled'}
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: step.done ? 400 : 600,
                    opacity: step.done ? 0.6 : 1,
                    bgcolor: step.done ? 'transparent' : 'primary.main',
                    color: step.done ? 'text.secondary' : '#fff',
                    '& .MuiChip-icon': { color: step.done ? 'success.main' : '#fff' },
                    borderColor: step.done ? 'divider' : 'transparent',
                  }}
                />
              ))}
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              size="small"
              variant="contained"
              onClick={() => router.push('/profile')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                px: 2,
              }}
            >
              Compléter
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={handleDismiss}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                color: 'text.secondary',
                fontSize: '0.8rem',
              }}
            >
              Plus tard
            </Button>
          </Box>
        </Box>
      </Alert>
    </Collapse>
  );
}
