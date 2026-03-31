'use client';

import { useAuth } from '@/providers/AuthProvider';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
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

export default function ProfileCompletionCard() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: adsData } = useQuery({
    queryKey: ['owner-ads-total'],
    queryFn: () => ownerService.getMyAds({ page: 1, per_page: 1 }),
  });

  const totalAds = (adsData as { meta?: { total?: number } })?.meta?.total ?? 0;

  if (!user) {
    return null;
  }

  const steps: Step[] = [
    { key: 'avatar', label: 'Ajouter une photo de profil', done: !!user.avatar, href: '/owner/profile' },
    { key: 'phone', label: 'Renseigner votre téléphone', done: !!user.phone_number, href: '/owner/profile' },
    { key: 'city', label: 'Indiquer votre ville', done: !!user.city_id, href: '/owner/profile' },
    { key: 'ad', label: 'Publier votre première annonce', done: totalAds > 0, href: '/owner/ads/new' },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  if (progress === 100) {
    return null;
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        mb: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Complétez votre profil
          </Typography>
          <Typography variant="caption" fontWeight={700} color="primary.main">
            {progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 6, borderRadius: 3, mb: 2 }}
        />
        <Stack spacing={1}>
          {steps.map((step) => (
            <Box
              key={step.key}
              onClick={() => !step.done && router.push(step.href)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 0.75,
                px: 1,
                borderRadius: 1.5,
                cursor: step.done ? 'default' : 'pointer',
                transition: 'background-color 0.15s',
                '&:hover': step.done ? {} : { bgcolor: 'action.hover' },
              }}
            >
              {step.done ? (
                <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
              ) : (
                <UncheckedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  textDecoration: step.done ? 'line-through' : 'none',
                  color: step.done ? 'text.disabled' : 'text.primary',
                }}
              >
                {step.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
