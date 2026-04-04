'use client';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import { useState } from 'react';

const STORAGE_KEY = (surveyId: string) => `survey_postponed_${surveyId}`;

/** Check if survey was postponed — uses backend preferences when user is authenticated. */
export function getSurveyPostponed(
  surveyId: string,
  user?: { preferences?: { survey_postponed_ids?: string[] } } | null
): boolean {
  if (user?.preferences?.survey_postponed_ids?.includes(surveyId)) return true;
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY(surveyId)) === 'true';
}

/** @deprecated Use API via onPostponed callback when authenticated. Kept for guest fallback. */
export function setSurveyPostponed(surveyId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY(surveyId), 'true');
}

interface SurveyBannerProps {
  surveyId: string;
  surveySlug?: string;
  title: string;
  description: string;
  onPlusTard?: () => void;
  /** Bottom nav height in px — used to position the banner above it. */
  bottomOffset?: number;
}

export default function SurveyBanner({
  surveyId,
  surveySlug,
  title,
  description,
  onPlusTard,
  bottomOffset = 64,
}: SurveyBannerProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  const handlePlusTard = () => {
    setSurveyPostponed(surveyId);
    onPlusTard?.();
    setVisible(false);
  };

  const handleParticiper = () => {
    router.push(`/surveys/${surveySlug ?? surveyId}`);
  };

  if (!visible) return null;

  return (
    <Paper
      elevation={0}
      className="aura-glass"
      sx={{
        position: 'fixed',
        bottom: {
          xs: `calc(${bottomOffset + 16}px + env(safe-area-inset-bottom, 0px))`,
          sm: 24,
        },
        left: { xs: 12, sm: 24 },
        right: { xs: 12, sm: 24 },
        zIndex: 1300,
        maxWidth: { xs: 'none', sm: 520 },
        mx: 'auto',
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: 'rgba(246, 71, 95, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <AssignmentOutlined sx={{ fontSize: 22 }} />
          </Box>
          <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
            <Typography
              component="h2"
              variant="subtitle1"
              fontWeight={700}
              sx={{
                fontSize: { xs: '1rem', sm: '1.0625rem' },
                lineHeight: 1.35,
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
                lineHeight: 1.55,
                maxWidth: '62ch',
              }}
            >
              {description}
            </Typography>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            flexWrap: 'nowrap',
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: { xs: 'stretch', sm: 'flex-end' },
            gap: 1,
            width: '100%',
          }}
        >
          <Button
            variant="outlined"
            onClick={handlePlusTard}
            sx={{
              borderRadius: 999,
              py: 1,
              px: { xs: 2, sm: 2.5 },
              fontWeight: 600,
              textTransform: 'none',
              color: 'text.secondary',
              borderColor: 'divider',
              width: { xs: '100%', sm: 'auto' },
              flexShrink: 0,
              alignSelf: { xs: 'stretch', sm: 'auto' },
            }}
          >
            Plus tard
          </Button>
          <Button
            variant="contained"
            onClick={handleParticiper}
            sx={{
              borderRadius: 999,
              py: 1,
              px: { xs: 2, sm: 2.75 },
              fontWeight: 700,
              textTransform: 'none',
              width: { xs: '100%', sm: 'auto' },
              flexShrink: 0,
              alignSelf: { xs: 'stretch', sm: 'auto' },
            }}
          >
            Participer
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
