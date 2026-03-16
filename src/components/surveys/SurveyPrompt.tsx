'use client';

import { Box, Button, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { AssignmentOutlined, Close } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { getSurveyPostponed } from './SurveyBanner';

interface SurveyPromptProps {
  surveyId: string;
  surveySlug?: string;
  title: string;
  description: string;
}

/**
 * Affiche le prompt flottant uniquement si l'utilisateur a déjà cliqué "Plus tard"
 * (stocké dans localStorage). Au prochain login, il réapparaît jusqu'à ce qu'il remplisse le sondage.
 */
export default function SurveyPrompt({ surveyId, surveySlug, title, description }: SurveyPromptProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getSurveyPostponed(surveyId)) return;
    if (typeof window === 'undefined') return;
    const dismissed = sessionStorage.getItem(`survey_dismissed_${surveyId}`);
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [surveyId]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`survey_dismissed_${surveyId}`, 'true');
    }
    setVisible(false);
  };

  const handleStart = () => {
    router.push(`/surveys/${surveySlug ?? surveyId}`);
  };

  if (!visible) return null;

  return (
    <Paper
      elevation={0}
      className="aura-glass"
      sx={{
        position: 'fixed',
        bottom: { xs: 80, sm: 24 },
        right: { xs: 12, sm: 24 },
        left: { xs: 12, sm: 'auto' },
        zIndex: 1000,
        maxWidth: { xs: 'none', sm: 360 },
        p: { xs: 2.5, sm: 3 },
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'rgba(246, 71, 95, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.main',
          }}
        >
          <AssignmentOutlined />
        </Box>
        <Close
          onClick={handleDismiss}
          sx={{ cursor: 'pointer', color: 'text.secondary', fontSize: 20, '&:hover': { color: 'text.primary' } }}
        />
      </Box>

      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.5 }}>
        {description}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleStart}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
        >
          Participer
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleDismiss}
          sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none', color: 'text.secondary', borderColor: 'divider' }}
        >
          Plus tard
        </Button>
      </Box>
    </Paper>
  );
}
