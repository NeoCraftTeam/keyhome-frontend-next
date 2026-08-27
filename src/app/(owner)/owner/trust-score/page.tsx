'use client';

import api from '@/lib/api';
import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import FadeIn from '@/components/ui/layout/FadeIn';
import PageBreadcrumbs from '@/components/ui/layout/PageBreadcrumbs';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Info from '@mui/icons-material/Info';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import Shield from '@mui/icons-material/Shield';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  Skeleton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface BreakdownComponent {
  score: number;
  max: number;
  label: string;
  value: string;
  tip: string;
}

interface TrustScoreData {
  score: number;
  tier: string;
  tier_label: string;
  tier_color: string;
  role_context: string;
  breakdown: Record<string, BreakdownComponent>;
  computed_at: string;
  tips: string[];
}

interface TrustScoreResponse {
  data: TrustScoreData | null;
  consent_required?: boolean;
  consent_declined?: boolean;
}

async function fetchMyTrustScore(): Promise<TrustScoreResponse> {
  const { data } = await api.get<TrustScoreResponse>('/my/trust-score');
  return data;
}

async function postConsent(consent: boolean): Promise<{ success: boolean }> {
  const { data } = await api.post('/my/trust-score/consent', { consent });
  return data;
}

function ScoreGauge({ score, color }: { score: number; color: string }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={140}
        thickness={5}
        sx={{ color: 'action.disabledBackground', position: 'absolute' }}
      />
      <CircularProgress
        variant="determinate"
        value={score}
        size={140}
        thickness={5}
        sx={{ color }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1 }}>
          {score}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          / 100
        </Typography>
      </Box>
    </Box>
  );
}

export default function OwnerTrustScorePage() {
  const queryClient = useQueryClient();

  const { data: resp, isLoading } = useQuery({
    queryKey: ['owner-trust-score'],
    queryFn: fetchMyTrustScore,
    staleTime: 5 * 60 * 1000,
  });

  const consentMutation = useMutation({
    mutationFn: postConsent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['owner-trust-score'] }),
  });

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Score de confiance' },
          ]}
        />
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <Shield sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h4" fontWeight={800}>
            Mon score de confiance
          </Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Votre score est calculé à partir de vos paiements, visites, avis et
          profil. Il est visible par les locataires sur votre profil public.
        </Typography>
      </FadeIn>

      {isLoading ? (
        <Stack spacing={2}>
          <Skeleton
            variant="rectangular"
            height={200}
            sx={{ borderRadius: 3 }}
          />
          <Skeleton
            variant="rectangular"
            height={300}
            sx={{ borderRadius: 3 }}
          />
        </Stack>
      ) : resp?.consent_required ? (
        /* ── Consent gate ─────────────────────────────── */
        <Card
          sx={{ borderRadius: 3, p: { xs: 3, md: 4 }, textAlign: 'center' }}
        >
          <Shield sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Activez votre score de confiance
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}
          >
            Le calcul de votre score nécessite votre consentement (RGPD). Vous
            pouvez le désactiver à tout moment.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => consentMutation.mutate(true)}
            disabled={consentMutation.isPending}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              px: 4,
            }}
          >
            {consentMutation.isPending ? (
              <ButtonSpinner size={20} />
            ) : (
              'Activer mon score'
            )}
          </Button>
        </Card>
      ) : resp?.consent_declined ? (
        /* ── Consent declined ─────────────────────────── */
        <Card sx={{ borderRadius: 3, p: { xs: 3, md: 4 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography fontWeight={700}>
                Score de confiance désactivé
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vous avez refusé le calcul. Activez-le pour améliorer votre
                visibilité.
              </Typography>
            </Box>
            <Switch
              checked={false}
              onChange={() => consentMutation.mutate(true)}
              disabled={consentMutation.isPending}
              color="primary"
            />
          </Stack>
        </Card>
      ) : resp?.data ? (
        /* ── Score display ────────────────────────────── */
        <Stack spacing={3}>
          {/* Summary card */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={4}
                alignItems="center"
              >
                <ScoreGauge
                  score={resp.data.score}
                  color={resp.data.tier_color}
                />
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Chip
                      label={resp.data.tier_label}
                      size="small"
                      sx={{
                        bgcolor: resp.data.tier_color,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    />
                    <Typography variant="caption" color="text.disabled">
                      Calculé le{' '}
                      {new Date(resp.data.computed_at).toLocaleDateString(
                        'fr-FR',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={800} gutterBottom>
                    {resp.data.score >= 80
                      ? 'Excellent bailleur'
                      : resp.data.score >= 60
                        ? 'Bailleur fiable'
                        : resp.data.score >= 40
                          ? 'Profil en cours de construction'
                          : 'Score à améliorer'}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Complétez votre profil, répondez aux visites et collectez
                    des avis pour augmenter votre score.
                  </Typography>
                  {/* Consent toggle */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mt: 2 }}
                  >
                    <Switch
                      checked={true}
                      onChange={() => consentMutation.mutate(false)}
                      disabled={consentMutation.isPending}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Score visible publiquement
                    </Typography>
                    <Tooltip title="Désactiver supprime votre score des profils publics">
                      <Info
                        sx={{
                          fontSize: 14,
                          color: 'text.disabled',
                          cursor: 'help',
                        }}
                      />
                    </Tooltip>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Détail par critère
              </Typography>
              <Stack spacing={2}>
                {Object.entries(resp.data.breakdown).map(([key, comp]) => {
                  const pct =
                    comp.max > 0
                      ? Math.round((comp.score / comp.max) * 100)
                      : 0;
                  // Use palette tokens so the bar resolves through the theme.
                  // Was hard-coded Tailwind hex which didn't adapt to dark mode.
                  const color =
                    pct >= 80
                      ? 'success.main'
                      : pct >= 50
                        ? 'warning.main'
                        : 'error.main';
                  return (
                    <Box key={key}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {comp.label}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {comp.value}
                          </Typography>
                          <Typography variant="caption" fontWeight={700}>
                            {comp.score}/{comp.max} pts
                          </Typography>
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          // `grey.100` is a fixed light shade that doesn't
                          // adapt to dark mode; `action.hover` resolves to
                          // a low-alpha neutral in both modes.
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: color,
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          {/* Tips */}
          {resp.data.tips.length > 0 && (
            <Card
              sx={{
                borderRadius: 3,
                bgcolor: 'primary.50',
                border: '1px solid',
                borderColor: 'primary.200',
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <LightbulbOutlined
                    sx={{ color: 'primary.main', fontSize: 20 }}
                  />
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    color="primary.main"
                  >
                    Conseils pour améliorer votre score
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  {resp.data.tips.map((tip, i) => (
                    <Stack
                      key={i}
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                    >
                      <CheckCircle
                        sx={{
                          fontSize: 16,
                          color: 'primary.main',
                          mt: 0.25,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2">{tip}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      ) : (
        <AppAlert
          severity="info"
          message="Aucun score calculé. Activez le score de confiance pour commencer."
        />
      )}
    </Container>
  );
}
