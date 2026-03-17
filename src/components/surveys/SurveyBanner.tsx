'use client';

import { Box, Button, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { AssignmentOutlined } from '@mui/icons-material';
import { useState } from 'react';

const STORAGE_KEY = (surveyId: string) => `survey_postponed_${surveyId}`;

/** Check if survey was postponed — uses backend preferences when user is authenticated. */
export function getSurveyPostponed(surveyId: string, user?: { preferences?: { survey_postponed_ids?: string[] } } | null): boolean {
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
}

export default function SurveyBanner({ surveyId, surveySlug, title, description, onPlusTard }: SurveyBannerProps) {
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
          xs: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          sm: 24,
        },
        left: { xs: 12, sm: 24 },
        right: { xs: 12, sm: 24 },
        zIndex: 1000,
        maxWidth: 480,
        mx: 'auto',
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'rgba(246, 71, 95, 0.1)',
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <AssignmentOutlined />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, wordBreak: 'break-word' }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.25, fontSize: { xs: '0.8rem', sm: '0.875rem' }, wordBreak: 'break-word' }}
          >
            {description}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            onClick={handlePlusTard}
            fullWidth
            sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none', color: 'text.secondary', borderColor: 'divider' }}
          >
            Plus tard
          </Button>
          <Button
            variant="contained"
            onClick={handleParticiper}
            fullWidth
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            Participer
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
