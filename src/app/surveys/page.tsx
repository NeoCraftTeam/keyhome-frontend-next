'use client';

import { publicSurveysService } from '@/services/publicSurveys.service';
import { PublicSurvey } from '@/types';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  IconButton,
  Skeleton,
  Typography,
} from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import FadeIn from '@/components/ui/FadeIn';

export default function SurveysIndexPage() {
  const router = useRouter();

  const { data: surveys, isLoading } = useQuery<PublicSurvey[]>({
    queryKey: ['public-surveys'],
    queryFn: () => publicSurveysService.list(),
  });

  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
      {/* Back button */}
      <Box sx={{ mb: 2 }}>
        <IconButton onClick={() => router.back()} size="small" aria-label="Retour" sx={{ border: '1px solid', borderColor: 'divider' }}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      {/* ── Header ── */}
      <FadeIn direction="up">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              mb: 2,
              p: 2,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(246,71,95,0.1) 0%, rgba(217,58,80,0.05) 100%)',
            }}
          >
            <AssignmentOutlinedIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>
          <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
            Donnez votre avis
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
            Vos réponses sont totalement anonymes et nous aident à améliorer KeyHome pour tout le monde.
          </Typography>
        </Box>
      </FadeIn>

      {/* ── Survey list ── */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={96} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : !surveys || surveys.length === 0 ? (
        <FadeIn direction="up" delay={0.1}>
          <Box
            sx={{
              py: 12,
              textAlign: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 4,
            }}
          >
            <QuizOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography fontWeight={600} color="text.secondary">
              Aucun sondage disponible pour l&apos;instant
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Revenez bientôt !
            </Typography>
          </Box>
        </FadeIn>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {surveys.map((survey, i) => (
            <FadeIn key={survey.id} direction="up" delay={i * 0.06}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 6px 24px rgba(246,71,95,0.10)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => router.push(`/surveys/${survey.slug}`)}
                  sx={{ p: 0 }}
                >
                  <CardContent
                    sx={{
                      p: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      '&:last-child': { pb: 3 },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        shrink: 0,
                        borderRadius: 2.5,
                        background: 'linear-gradient(135deg, #F6475F 0%, #D93A50 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(246,71,95,0.25)',
                      }}
                    >
                      <AssignmentOutlinedIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        noWrap
                        sx={{ letterSpacing: '-0.01em' }}
                      >
                        {survey.title}
                      </Typography>
                      {survey.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{ mt: 0.25 }}
                        >
                          {survey.description}
                        </Typography>
                      )}
                      {survey.questions_count != null && (
                        <Chip
                          label={`${survey.questions_count} question${survey.questions_count > 1 ? 's' : ''}`}
                          size="small"
                          sx={{ mt: 1, height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                        />
                      )}
                    </Box>

                    <ChevronRightIcon sx={{ color: 'text.disabled', flexShrink: 0 }} />
                  </CardContent>
                </CardActionArea>
              </Card>
            </FadeIn>
          ))}
        </Box>
      )}
    </Container>
  );
}
