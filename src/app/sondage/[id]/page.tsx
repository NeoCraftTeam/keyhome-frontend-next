'use client';

import SurveyForm from '@/components/surveys/SurveyForm';
import FadeIn from '@/components/ui/FadeIn';
import { useAuth } from '@/providers/AuthProvider';
import { surveysService } from '@/services/surveys.service';
import { brandAgent } from '@/theme/tokens';
import { SurveyAnswerPayload, UserRole } from '@/types';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SurveyPage() {
  const params = useParams();
  const surveyId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwner =
    user?.role === UserRole.AGENT || user?.role === UserRole.ADMIN;
  const accentColor = isOwner ? brandAgent.primary : undefined;
  const [submitted, setSubmitted] = useState(false);

  const {
    data: survey,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => surveysService.get(surveyId),
    enabled: !!surveyId,
  });

  const mutation = useMutation({
    mutationFn: ({
      answers,
      anonymous,
    }: {
      answers: SurveyAnswerPayload[];
      anonymous: boolean;
    }) => surveysService.submitResponse(surveyId, answers, anonymous),
    onSuccess: () => {
      setSubmitted(true);
      // RC-4: immediately mark as answered in the shared cache so the layout
      // banner is suppressed without waiting for staleTime to expire.
      queryClient.setQueryData(['survey-has-answered', surveyId], {
        has_answered: true,
      });
      // Invalidate remaining variant keys used by other panels / pages.
      queryClient.invalidateQueries({
        queryKey: ['survey-has-answered-owner'],
      });
      queryClient.invalidateQueries({ queryKey: ['auth-survey-has-answered'] });
    },
  });

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error || !survey) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom fontWeight={700}>
          Sondage introuvable
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Le sondage que vous recherchez n&apos;existe pas ou a été désactivé.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => router.push('/home')}
          sx={{ borderRadius: 3, px: 4 }}
        >
          Retour à l&apos;accueil
        </Button>
      </Container>
    );
  }

  if (submitted) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <FadeIn direction="up">
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <CheckCircleOutline
              sx={{ fontSize: 80, color: 'success.main', mb: 3 }}
            />
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Merci !
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mb: 4, fontSize: '1.1rem' }}
            >
              Vos réponses ont bien été enregistrées. Votre avis nous aide à
              améliorer KeyHome pour tout le monde.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/home')}
              sx={{ borderRadius: 3, px: 6, py: 1.5, fontWeight: 700 }}
            >
              Retour à l&apos;accueil
            </Button>
          </Paper>
        </FadeIn>
      </Container>
    );
  }

  return (
    <SurveyForm
      survey={survey}
      onSubmit={(answers, anonymous) => mutation.mutate({ answers, anonymous })}
      isSubmitting={mutation.isPending}
      accentColor={accentColor}
    />
  );
}
