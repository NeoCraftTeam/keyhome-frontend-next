'use client';

import PageBreadcrumbs from '@/components/ui/layout/PageBreadcrumbs';
import {
  subscriptionsService,
  type SubscriptionPlan,
  type CurrentSubscription,
} from '@/services/subscriptions.service';
import { rememberPaymentOriginPath } from '@/lib/payment/payment-return';
import { getSafeErrorMessage } from '@/lib/error-messages';
import {
  Autorenew as AutorenewIcon,
  CalendarMonth as CalendarIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  Subscriptions as SubscriptionsIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import FadeIn from '@/components/ui/layout/FadeIn';
import { brandAgent } from '@/theme/tokens';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

type BillingPeriod = 'monthly' | 'yearly';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatXaf(amount: number | null | undefined): string {
  if (!amount) return '—';
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

interface PlanPriceProps {
  plan: SubscriptionPlan;
  period: BillingPeriod;
}

function PlanPrice({ plan, period }: PlanPriceProps) {
  const price = period === 'yearly' ? plan.price_yearly : plan.price_monthly;
  if (price === null || price === undefined) {
    return (
      <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
        Tarification {period === 'yearly' ? 'annuelle' : 'mensuelle'}{' '}
        indisponible
      </Typography>
    );
  }
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="h4"
        fontWeight={800}
        color="primary.main"
        sx={{ display: 'inline-block', lineHeight: 1.1 }}
      >
        {formatXaf(price)}
      </Typography>
      <Typography
        component="span"
        variant="caption"
        color="text.secondary"
        sx={{ ml: 0.5 }}
      >
        / {period === 'yearly' ? 'an' : 'mois'}
      </Typography>
      {period === 'yearly' && plan.yearly_savings && plan.yearly_savings > 0 ? (
        <Chip
          size="small"
          color="success"
          label={`Économisez ${formatXaf(plan.yearly_savings)}/an`}
          sx={{ ml: 1, fontWeight: 700 }}
        />
      ) : null}
    </Box>
  );
}

interface CurrentSubscriptionCardProps {
  current: CurrentSubscription;
  onCancel: () => void;
  onToggleAutoRenew: (enabled: boolean) => void;
  isCancelling: boolean;
  isTogglingAutoRenew: boolean;
  checkoutPending: boolean;
}

function CurrentSubscriptionCard({
  current,
  onCancel,
  onToggleAutoRenew,
  isCancelling,
  isTogglingAutoRenew,
  checkoutPending,
}: CurrentSubscriptionCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '2px solid',
        borderColor: 'primary.main',
        mb: 4,
        bgcolor: alpha(brandAgent.primary, 0.04),
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              fontWeight={700}
              color="primary.main"
              noWrap
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={current.plan?.name ?? 'Abonnement'}
            >
              {current.plan?.name ?? 'Abonnement'}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 1, flexWrap: 'wrap' }}
            >
              <Chip
                size="small"
                color={current.is_active ? 'success' : 'warning'}
                label={current.is_active ? 'Actif' : current.status}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                size="small"
                variant="outlined"
                label={
                  current.billing_period === 'yearly' ? 'Annuel' : 'Mensuel'
                }
              />
              <Chip
                size="small"
                variant="outlined"
                label={current.amount_paid_formatted}
              />
            </Stack>
          </Box>
          {current.ends_at && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                color: 'text.secondary',
              }}
            >
              <Stack direction="row" spacing={0.75} alignItems="center">
                <CalendarIcon fontSize="small" />
                <Typography variant="body2">
                  {current.cancelled_at ? 'Expire le' : 'Renouvellement le'}{' '}
                  <strong>{formatDate(current.ends_at)}</strong>
                </Typography>
              </Stack>
              {current.days_remaining > 0 && (
                <Typography
                  variant="caption"
                  color={
                    current.days_remaining < 7 ? 'warning.main' : undefined
                  }
                >
                  {current.days_remaining} jour
                  {current.days_remaining > 1 ? 's' : ''} restant
                  {current.days_remaining > 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AutorenewIcon
              fontSize="small"
              color={current.auto_renew ? 'success' : 'disabled'}
            />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Renouvellement automatique
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {current.auto_renew
                  ? 'Votre abonnement sera renouvelé automatiquement.'
                  : "Votre abonnement s'arrêtera à la fin de la période payée."}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Switch
              checked={current.auto_renew}
              onChange={(e) => onToggleAutoRenew(e.target.checked)}
              disabled={
                checkoutPending || isTogglingAutoRenew || !!current.cancelled_at
              }
              color="primary"
            />
            {!current.cancelled_at && (
              <Button
                size="small"
                color="error"
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
                disabled={checkoutPending || isCancelling}
              >
                Annuler
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  period: BillingPeriod;
  isCurrent: boolean;
  isProcessing: boolean;
  onSelect: () => void;
  hasActiveSubscription: boolean;
}

function PlanCard({
  plan,
  period,
  isCurrent,
  isProcessing,
  onSelect,
  hasActiveSubscription,
}: PlanCardProps) {
  const priceForPeriod =
    period === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const isAvailable = priceForPeriod !== null && priceForPeriod > 0;

  return (
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
            gap: 1,
            minWidth: 0,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              flex: '1 1 auto',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={plan.name}
          >
            {plan.name}
          </Typography>
          {plan.boost_score ? (
            <Chip
              size="small"
              color="primary"
              icon={<TrendingUpIcon />}
              label="Boost inclus"
              sx={{ fontWeight: 600, flexShrink: 0 }}
            />
          ) : null}
        </Box>
        <PlanPrice plan={plan} period={period} />
        {plan.description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {plan.description}
          </Typography>
        ) : null}
        {plan.features && plan.features.length > 0 ? (
          <>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1} sx={{ flex: 1 }}>
              {plan.features.map((feature, i) => (
                <Box
                  key={`${plan.id}-feat-${i}`}
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
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        ) : null}
        <Button
          variant={isCurrent ? 'outlined' : 'contained'}
          fullWidth
          disabled={
            isCurrent ||
            isProcessing ||
            !isAvailable ||
            (hasActiveSubscription && !isCurrent)
          }
          onClick={onSelect}
          sx={{ mt: 3, borderRadius: 2, fontWeight: 600 }}
          startIcon={isProcessing ? <CircularProgress size={16} /> : undefined}
        >
          {isCurrent
            ? 'Plan actuel'
            : !isAvailable
              ? 'Indisponible'
              : hasActiveSubscription
                ? 'Abonnement actif'
                : 'Souscrire'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function OwnerSubscriptionsPage() {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info';
  } | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  const {
    data: currentResponse,
    isLoading: isLoadingCurrent,
    isError: currentQueryError,
    isFetched: currentFetched,
    refetch: refetchCurrent,
    isFetching: isFetchingCurrent,
  } = useQuery({
    queryKey: ['subscriptions-current'],
    queryFn: ({ signal }) => subscriptionsService.getCurrent({ signal }),
  });

  const current = currentResponse?.subscription ?? null;
  const hasActiveSubscription = Boolean(current && current.is_active);

  const {
    data: plans = [],
    isLoading: isLoadingPlans,
    isError: plansQueryError,
    isFetched: plansFetched,
    refetch: refetchPlans,
    isFetching: isFetchingPlans,
  } = useQuery({
    queryKey: ['subscriptions-plans'],
    queryFn: ({ signal }) => subscriptionsService.getPlans({ signal }),
  });

  const subscriptionsLoadFailed =
    (currentFetched && currentQueryError) || (plansFetched && plansQueryError);

  const refetchSubscriptions = (): void => {
    void refetchCurrent();
    void refetchPlans();
  };

  const subscriptionsRefetchBusy = isFetchingCurrent || isFetchingPlans;

  const subscribeMutation = useMutation({
    mutationFn: ({
      planId,
      billingPeriod,
    }: {
      planId: string;
      billingPeriod: BillingPeriod;
    }) => subscriptionsService.subscribe(planId, billingPeriod),
    onSuccess: (data) => {
      // Persist the page we leave from so the Flutterwave callback can return here.
      rememberPaymentOriginPath();
      window.location.assign(data.payment_url);
    },
    onError: (err) => {
      setPendingPlanId(null);
      setSnackbar({
        message: getSafeErrorMessage(err, 'Impossible de lancer le paiement.'),
        severity: 'error',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => subscriptionsService.cancel(reason),
    onSuccess: () => {
      setConfirmCancelOpen(false);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['subscriptions-current'] });
      setSnackbar({
        message:
          "Votre abonnement a été annulé. Il reste actif jusqu'à la fin de la période payée.",
        severity: 'info',
      });
    },
    onError: (err) => {
      setSnackbar({
        message: getSafeErrorMessage(err, "Échec de l'annulation."),
        severity: 'error',
      });
    },
  });

  const autoRenewMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      subscriptionsService.toggleAutoRenew(enabled),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: ['subscriptions-current'] }),
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions-current'] });
      setSnackbar({
        message: enabled
          ? 'Renouvellement automatique activé.'
          : 'Renouvellement automatique désactivé.',
        severity: 'success',
      });
    },
    onError: (err) => {
      setSnackbar({
        message: getSafeErrorMessage(err, 'Action impossible.'),
        severity: 'error',
      });
    },
  });

  const handleSelect = (plan: SubscriptionPlan) => {
    setPendingPlanId(plan.id);
    subscribeMutation.mutate({ planId: plan.id, billingPeriod: period });
  };

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
            Gérez votre abonnement, activez le renouvellement automatique et
            faites évoluer votre offre.
          </Typography>
        </Box>
      </FadeIn>

      {subscriptionsLoadFailed && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              disabled={subscriptionsRefetchBusy || !isOnline}
              onClick={() => refetchSubscriptions()}
            >
              Réessayer
            </Button>
          }
        >
          {!isOnline
            ? 'Vous semblez hors ligne. Reconnectez-vous au réseau puis réessayez.'
            : 'Impossible de charger vos abonnements pour le moment.'}
        </Alert>
      )}

      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Votre abonnement actuel
      </Typography>
      {isLoadingCurrent ? (
        <Skeleton
          variant="rectangular"
          height={140}
          sx={{ borderRadius: 3, mb: 4 }}
        />
      ) : currentQueryError ? null : current ? (
        <CurrentSubscriptionCard
          current={current}
          onCancel={() => setConfirmCancelOpen(true)}
          onToggleAutoRenew={(enabled) => autoRenewMutation.mutate(enabled)}
          isCancelling={cancelMutation.isPending}
          isTogglingAutoRenew={autoRenewMutation.isPending}
          checkoutPending={subscribeMutation.isPending}
        />
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

      {(isLoadingPlans || plans.length > 0) &&
        !(plansFetched && plansQueryError) && (
          <>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" fontWeight={700}>
                Nos offres
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={period}
                onChange={(_, v) => v && setPeriod(v as BillingPeriod)}
                aria-label="Période de facturation"
              >
                <ToggleButton
                  value="monthly"
                  aria-label="Tarification mensuelle"
                >
                  Mensuel
                </ToggleButton>
                <ToggleButton value="yearly" aria-label="Tarification annuelle">
                  Annuel
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {isLoadingPlans ? (
              <Grid container spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Skeleton
                      variant="rectangular"
                      height={320}
                      sx={{ borderRadius: 3 }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid container spacing={2}>
                {plans.map((plan) => {
                  const isCurrent =
                    current?.plan?.id === plan.id &&
                    current.billing_period === period;
                  return (
                    <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <PlanCard
                        plan={plan}
                        period={period}
                        isCurrent={isCurrent}
                        isProcessing={
                          subscribeMutation.isPending &&
                          pendingPlanId === plan.id
                        }
                        hasActiveSubscription={hasActiveSubscription}
                        onSelect={() => handleSelect(plan)}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </>
        )}

      {/* Cancel dialog */}
      <Dialog
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Annuler l&apos;abonnement</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Votre abonnement reste actif jusqu&apos;à la fin de la période
            payée. Vous ne serez pas facturé à nouveau. Souhaitez-vous nous
            indiquer la raison ?
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Raison (facultatif)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            inputProps={{ maxLength: 500 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancelOpen(false)}>Retour</Button>
          <Button
            color="error"
            variant="contained"
            disabled={cancelMutation.isPending || subscribeMutation.isPending}
            onClick={() => cancelMutation.mutate(cancelReason || undefined)}
          >
            Confirmer l&apos;annulation
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={5000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}
