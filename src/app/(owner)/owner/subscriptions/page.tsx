'use client';

import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import {
  subscriptionsService,
  type SubscriptionPlan,
} from '@/services/subscriptions.service';
import {
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  Subscriptions as SubscriptionsIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import FadeIn from '@/components/ui/FadeIn';

function PeriodChip({ period }: { period: SubscriptionPlan['period'] }) {
  return (
    <Chip
      label={period === 'yearly' ? 'Annuel' : 'Mensuel'}
      size="small"
      color={period === 'yearly' ? 'success' : 'default'}
      sx={{ fontWeight: 600 }}
    />
  );
}

export default function OwnerSubscriptionsPage() {
  const { data: current, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['subscriptions-current'],
    queryFn: () => subscriptionsService.getCurrent(),
  });

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscriptions-plans'],
    queryFn: () => subscriptionsService.getPlans(),
  });

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Abonnements' },
          ]}
        />
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Abonnements
          </Typography>
          <Typography color="text.secondary">
            Gérez votre abonnement et découvrez nos offres disponibles.
          </Typography>
        </Box>
      </FadeIn>

      {/* Current subscription */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Votre abonnement actuel
      </Typography>
      {isLoadingCurrent ? (
        <Skeleton
          variant="rectangular"
          height={120}
          sx={{ borderRadius: 3, mb: 4 }}
        />
      ) : current ? (
        <Card
          sx={{
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'primary.main',
            mb: 4,
            bgcolor: 'rgba(13,148,136,0.04)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {current.plan_name}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mt: 1 }}
                >
                  <Chip
                    label={
                      current.status === 'active' ? 'Actif' : current.status
                    }
                    size="small"
                    color={current.status === 'active' ? 'success' : 'warning'}
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              </Box>
              {current.current_period_end && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  <CalendarIcon fontSize="small" />
                  <Typography variant="body2">
                    Renouvellement le{' '}
                    <strong>
                      {new Date(current.current_period_end).toLocaleDateString(
                        'fr-FR'
                      )}
                    </strong>
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            mb: 4,
            textAlign: 'center',
            py: 5,
          }}
        >
          <SubscriptionsIcon
            sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
          />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Aucun abonnement actif
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            Les abonnements concernent les agences. Créez ou rejoignez une
            agence pour souscrire à un plan.
          </Typography>
        </Card>
      )}

      {/* Plans */}
      {(isLoadingPlans || plans.length > 0) && (
        <>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Nos offres
          </Typography>
          {isLoadingPlans ? (
            <Grid container spacing={2}>
              {[1, 2, 3].map((i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Skeleton
                    variant="rectangular"
                    height={260}
                    sx={{ borderRadius: 3 }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={2}>
              {plans.map((plan) => {
                const isCurrent = current?.plan_id === plan.id;
                return (
                  <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: isCurrent ? 'primary.main' : 'divider',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'box-shadow 0.2s, transform 0.2s',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          p: 3,
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1,
                          }}
                        >
                          <Typography variant="h6" fontWeight={700}>
                            {plan.name}
                          </Typography>
                          <PeriodChip period={plan.period} />
                        </Box>
                        <Typography
                          variant="h4"
                          fontWeight={800}
                          color="primary.main"
                          sx={{ mb: 0.5 }}
                        >
                          {(plan.price ?? 0).toLocaleString('fr-FR')} XAF
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          /{plan.period === 'yearly' ? 'an' : 'mois'}
                        </Typography>
                        {plan.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            {plan.description}
                          </Typography>
                        )}
                        {plan.features && plan.features.length > 0 && (
                          <>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={1} sx={{ flex: 1 }}>
                              {plan.features.map((feature, i) => (
                                <Box
                                  key={i}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <CheckIcon
                                    fontSize="small"
                                    color="success"
                                    sx={{ flexShrink: 0 }}
                                  />
                                  <Typography variant="body2">
                                    {feature}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </>
                        )}
                        <Button
                          variant={isCurrent ? 'outlined' : 'contained'}
                          fullWidth
                          disabled={isCurrent}
                          sx={{ mt: 3, borderRadius: 2, fontWeight: 600 }}
                        >
                          {isCurrent ? 'Plan actuel' : 'Sélectionner'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
}
