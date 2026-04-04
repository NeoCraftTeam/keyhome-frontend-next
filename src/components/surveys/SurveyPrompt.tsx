'use client';

import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import Close from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import { getSurveyPostponed } from './SurveyBanner';

interface SurveyPromptProps {
  surveyId: string;
  surveySlug?: string;
  title: string;
  description: string;
  /** Bottom nav height in px — used to position the prompt above it. */
  bottomOffset?: number;
}

/**
 * Affiche le prompt flottant uniquement si l'utilisateur a déjà cliqué "Plus tard"
 * (stocké dans localStorage). Au prochain login, il réapparaît jusqu'à ce qu'il remplisse le sondage.
 */
export default function SurveyPrompt({
  surveyId,
  surveySlug,
  title,
  description,
  bottomOffset = 64,
}: SurveyPromptProps) {
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
        bottom: {
          xs: `calc(${bottomOffset + 16}px + env(safe-area-inset-bottom, 0px))`,
          sm: 24,
        },
        right: { xs: 12, sm: 24 },
        left: { xs: 12, sm: 'auto' },
        zIndex: 1300,
        maxWidth: { xs: 'none', sm: 420 },
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="flex-start"
            sx={{ flex: 1, minWidth: 0 }}
          >
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
            <Stack spacing={0.75} sx={{ minWidth: 0, pt: 0.25 }}>
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
                  lineHeight: 1.55,
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                }}
              >
                {description}
              </Typography>
            </Stack>
          </Stack>
          <IconButton
            size="small"
            onClick={handleDismiss}
            aria-label="Fermer"
            sx={{ color: 'text.secondary', mt: -0.5, mr: -0.5 }}
          >
            <Close fontSize="small" />
          </IconButton>
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
            onClick={handleDismiss}
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
            onClick={handleStart}
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
