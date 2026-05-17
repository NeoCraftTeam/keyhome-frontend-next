'use client';

import { surveysService } from '@/services/surveys.service';
import { SurveyAnswerPayload } from '@/types';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import SurveyForm from '@/components/surveys/SurveyForm';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ArrowBack from '@mui/icons-material/ArrowBack';
import FadeIn from '@/components/ui/FadeIn';

export default function SurveyPage() {
  const params = useParams();
  const surveyId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
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
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <FadeIn direction="up">
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{
            mb: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Retour
        </Button>
        <SurveyForm
          survey={survey}
          onSubmit={(answers, anonymous) =>
            mutation.mutate({ answers, anonymous })
          }
          isSubmitting={mutation.isPending}
        />
      </FadeIn>
    </Container>
  );
}
