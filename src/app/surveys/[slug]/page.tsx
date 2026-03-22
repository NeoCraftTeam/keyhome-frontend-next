'use client';

import { publicSurveysService } from '@/services/publicSurveys.service';
import { surveysService } from '@/services/surveys.service';
import { PublicSurvey, SurveyAnswerPayload } from '@/types';
import SurveyStepper from '@/components/surveys/public/SurveyStepper';
import FadeIn from '@/components/ui/FadeIn';
import { useAuth } from '@/providers/AuthProvider';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  FormControlLabel,
  Paper,
  Skeleton,
  Switch,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SentimentDissatisfiedOutlinedIcon from '@mui/icons-material/SentimentDissatisfiedOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { brand, gradient } from '@/theme/tokens';

export default function SurveySlugPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showThankYou, setShowThankYou] = useState(false);
  const [submitAnonymously, setSubmitAnonymously] = useState(true);

  const {
    data: survey,
    isLoading,
    error,
  } = useQuery<PublicSurvey>({
    queryKey: ['public-survey', slug],
    queryFn: () => publicSurveysService.get(slug),
    enabled: !!slug,
  });

  const { data: authAnswered } = useQuery<{ has_answered: boolean }>({
    queryKey: ['auth-survey-has-answered', survey?.id, isAuthenticated],
    queryFn: () => surveysService.hasAnswered(survey!.id),
    enabled: isAuthenticated && !!survey?.id,
    staleTime: 60_000,
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: async (answers: SurveyAnswerPayload[]) => {
      if (isAuthenticated && survey?.id) {
        await surveysService.submitResponse(survey.id, answers, submitAnonymously);
        return { submitted: true };
      }

      return publicSurveysService.submit(slug, answers);
    },
    onSuccess: () => {
      setShowThankYou(true);
    },
  });

  useEffect(() => {
    if (!showThankYou) {
      return;
    }

    const timer = setTimeout(() => {
      router.push('/search?sort=created_at&order=desc');
    }, 2200);

    return () => clearTimeout(timer);
  }, [showThankYou, router]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Skeleton variant="rounded" height={48} width="60%" sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rounded" height={24} width="40%" sx={{ mb: 5, borderRadius: 2 }} />
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 4 }} />
      </Container>
    );
  }

  /* ── Error / 404 ── */
  if (error || !survey) {
    return (
      <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
        <SentimentDissatisfiedOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Sondage introuvable
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Ce sondage n&apos;existe pas ou a été désactivé.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/surveys')}
          sx={{ borderRadius: 2.5, px: 4 }}
        >
          Voir tous les sondages
        </Button>
      </Container>
    );
  }

  /* ── Already submitted ── */
  if (survey.already_submitted || (isAuthenticated && authAnswered?.has_answered)) {
    return (
      <Container maxWidth="sm" sx={{ py: 12 }}>
        <FadeIn direction="up">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                p: 2,
                mb: 3,
                borderRadius: 3,
                bgcolor: '#E8F5E9',
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 48, color: '#2E7D32' }} />
            </Box>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Déjà répondu !
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Vous avez déjà participé à ce sondage. Merci pour votre contribution.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/search?sort=created_at&order=desc')}
              sx={{ borderRadius: 2.5, px: 4 }}
            >
              Voir les dernières annonces
            </Button>
          </Paper>
        </FadeIn>
      </Container>
    );
  }

  /* ── Survey stepper ── */
  return (
    <>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <FadeIn direction="up">
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/surveys')}
            sx={{
              mb: 4,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
              '&:hover': { color: 'primary.main', bgcolor: brand.primaryAlpha5 },
            }}
          >
            Tous les sondages
          </Button>

          {/* Survey title + description */}
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="h4"
              fontWeight={800}
              gutterBottom
              className="aura-gradient-text"
              sx={{ letterSpacing: '-0.02em' }}
            >
              {survey.title}
            </Typography>
            {survey.description && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.7, maxWidth: 580 }}
              >
                {survey.description}
              </Typography>
            )}

            {isAuthenticated && (
              <FormControlLabel
                sx={{ mt: 2 }}
                control={
                  <Switch
                    checked={submitAnonymously}
                    onChange={(event) => setSubmitAnonymously(event.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Envoyer mes réponses en mode anonyme
                  </Typography>
                }
              />
            )}
          </Box>

          <SurveyStepper
            survey={survey}
            onSubmit={(answers) => mutation.mutate(answers)}
            isSubmitting={mutation.isPending}
          />
        </FadeIn>
      </Container>

      {/* ── Thank-you Dialog ── */}
      <Dialog
        open={showThankYou}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'visible',
            mx: 2,
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
          {/* Animated checkmark */}
          <Box
            sx={{
              display: 'inline-flex',
              mb: 3,
              p: 2.5,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(46,125,50,0.12) 0%, rgba(46,125,50,0.06) 100%)',
              '@keyframes popIn': {
                '0%': { transform: 'scale(0.5)', opacity: 0 },
                '70%': { transform: 'scale(1.15)' },
                '100%': { transform: 'scale(1)', opacity: 1 },
              },
              animation: 'popIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s both',
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 72,
                color: '#2E7D32',
                filter: 'drop-shadow(0 4px 16px rgba(46,125,50,0.25))',
              }}
            />
          </Box>

          <Typography
            variant="h4"
            fontWeight={800}
            gutterBottom
            sx={{ letterSpacing: '-0.02em' }}
          >
            Merci pour votre avis&nbsp;!
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.7, fontSize: '1.05rem' }}>
            Merci pour votre retour. Nous vous redirigeons vers les dernières annonces.
          </Typography>

          {submitAnonymously && (
            <Box
              sx={{
                mb: 4,
                px: 3,
                py: 2,
                borderRadius: 2.5,
                bgcolor: brand.primaryAlpha5,
                border: '1px solid rgba(246,71,95,0.15)',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                🔒&nbsp; Réponse enregistrée en mode anonyme.
              </Typography>
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/search?sort=created_at&order=desc')}
              sx={{
                borderRadius: 3,
                py: 1.5,
                fontWeight: 700,
                background: gradient.primary135Stops,
                boxShadow: '0 6px 20px rgba(246,71,95,0.30)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #E83D55 0%, #C93248 100%)',
                  boxShadow: '0 8px 24px rgba(246,71,95,0.40)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Voir les dernières annonces
            </Button>

            <Button
              variant="text"
              size="large"
              onClick={() => router.push('/')}
              sx={{
                borderRadius: 3,
                py: 1,
                fontWeight: 500,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              Retour à l&apos;accueil
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

