'use client';

import { useAuth } from '@/providers/AuthProvider';
import {
  brandAgent,
  neutral,
  semantic,
  shadow,
  transition,
} from '@/theme/tokens';
import {
  CheckCircle as CheckIcon,
  ChevronRight,
  RadioButtonUnchecked as UncheckedIcon,
  Rocket as RocketIcon,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Card,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ownerService } from '@/services/owner.service';

interface Step {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

const STEP_ROW_ANIMATION_REDUCED = {
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'none',
    '&:hover': { transform: 'none' },
  },
} as const;

export default function ProfileCompletionCard() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: adsData } = useQuery({
    queryKey: ['owner-ads-total'],
    queryFn: () => ownerService.getMyAds({ page: 1, per_page: 1 }),
  });

  const totalAds = (adsData as { meta?: { total?: number } })?.meta?.total ?? 0;

  if (!user) return null;

  const steps: Step[] = [
    {
      key: 'avatar',
      label: 'Ajouter une photo de profil',
      done: !!user.avatar,
      href: '/owner/profile',
    },
    {
      key: 'phone',
      label: 'Renseigner votre téléphone',
      done: !!user.phone_number,
      href: '/owner/profile',
    },
    {
      key: 'city',
      label: 'Indiquer votre ville',
      done: !!user.city_id,
      href: '/owner/profile',
    },
    {
      key: 'ad',
      label: 'Publier votre première annonce',
      done: totalAds > 0,
      href: '/owner/ads/new',
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  if (progress === 100) return null;

  const pendingSteps = steps.filter((s) => !s.done);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        mb: 3,
        overflow: 'hidden',
        transition: transition.polish,
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
        '&:hover': {
          boxShadow: shadow.ownerTeaserHover,
          '@media (prefers-reduced-motion: reduce)': {
            boxShadow: 'none',
          },
        },
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            bgcolor: alpha(neutral.white, 0.18),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <RocketIcon sx={{ fontSize: 18, color: neutral.white }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="white"
            sx={{ lineHeight: 1.3 }}
          >
            Activez votre profil
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: alpha(neutral.white, 0.8) }}
          >
            {pendingSteps.length} étape{pendingSteps.length > 1 ? 's' : ''}{' '}
            restante{pendingSteps.length > 1 ? 's' : ''}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            color: alpha(neutral.white, 0.95),
            fontSize: '1.1rem',
            letterSpacing: '-0.5px',
          }}
        >
          {progress}%
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
          borderRadius: 0,
          bgcolor: brandAgent.primaryAlpha12,
          '& .MuiLinearProgress-bar': {
            bgcolor: 'primary.main',
            transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          },
          '@media (prefers-reduced-motion: reduce)': {
            '& .MuiLinearProgress-bar': { transition: 'none' },
          },
        }}
      />

      <Stack spacing={0} sx={{ p: { xs: 1.5, md: 2 } }}>
        {steps.map((step, idx) => (
          <Box
            key={step.key}
            onClick={() => !step.done && router.push(step.href)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1,
              px: 1,
              borderRadius: 2,
              cursor: step.done ? 'default' : 'pointer',
              transition: `background-color 0.22s cubic-bezier(0.22, 1, 0.36, 1), transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)`,
              '&:hover': step.done
                ? {}
                : {
                    bgcolor: brandAgent.primaryAlpha08,
                    transform: 'translateX(2px)',
                  },
              animation: `fadeInUp 0.4s cubic-bezier(0.22,1,0.36,1) both`,
              animationDelay: `${idx * 0.06}s`,
              ...STEP_ROW_ANIMATION_REDUCED,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                flexShrink: 0,
                bgcolor: step.done
                  ? alpha(semantic.successBright, 0.1)
                  : brandAgent.primaryAlpha08,
                transition: `${transition.polish}`,
                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'none',
                },
              }}
            >
              {step.done ? (
                <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <UncheckedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                flex: 1,
                fontWeight: step.done ? 400 : 500,
                textDecoration: step.done ? 'line-through' : 'none',
                color: step.done ? 'text.disabled' : 'text.primary',
              }}
            >
              {step.label}
            </Typography>

            {!step.done && (
              <ChevronRight
                sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }}
              />
            )}
          </Box>
        ))}
      </Stack>
    </Card>
  );
}
