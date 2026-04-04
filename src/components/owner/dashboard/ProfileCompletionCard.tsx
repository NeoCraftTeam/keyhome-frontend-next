'use client';

import { useAuth } from '@/providers/AuthProvider';
import CheckIcon from '@mui/icons-material/CheckCircle';
import ChevronRight from '@mui/icons-material/ChevronRight';
import UncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RocketIcon from '@mui/icons-material/Rocket';
import { Box, Card, LinearProgress, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ownerService } from '@/services/owner.service';

interface Step {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

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
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(13,148,136,0.1)',
        },
      }}
    >
      {/* Gradient header */}
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
            bgcolor: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <RocketIcon sx={{ fontSize: 18, color: '#fff' }} />
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
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {pendingSteps.length} étape{pendingSteps.length > 1 ? 's' : ''}{' '}
            restante{pendingSteps.length > 1 ? 's' : ''}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            color: 'rgba(255,255,255,0.95)',
            fontSize: '1.1rem',
            letterSpacing: '-0.5px',
          }}
        >
          {progress}%
        </Typography>
      </Box>

      {/* Progress bar — flush under the header */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
          borderRadius: 0,
          bgcolor: 'rgba(13,148,136,0.12)',
          '& .MuiLinearProgress-bar': {
            bgcolor: 'primary.main',
            transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          },
        }}
      />

      {/* Steps */}
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
              transition: 'background-color 0.15s, transform 0.15s',
              '&:hover': step.done
                ? {}
                : {
                    bgcolor: 'rgba(13,148,136,0.06)',
                    transform: 'translateX(2px)',
                  },
              // Staggered fade-in via animation-delay
              animation: 'fadeInUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
              animationDelay: `${idx * 0.06}s`,
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
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(13,148,136,0.08)',
                transition: 'background-color 0.2s',
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
