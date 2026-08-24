'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import { isImplicitDialogDismissReason } from '@/lib/dialog-dismiss';
import { getStripePromise } from '@/lib/payment/stripe';
import { paymentsService } from '@/services/payments.service';
import { brand } from '@/theme/tokens';
import type { StripePaymentMethod } from '@/types';
import AddIcon from '@mui/icons-material/Add';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

/** Query key — kept stable so other components can prefetch / invalidate it. */
export const STRIPE_SAVED_CARDS_QUERY_KEY = ['payments', 'stripe', 'cards'];

/**
 * Maps Stripe `brand` strings to a short French label.
 */
function brandLabel(value: string): string {
  switch (value.toLowerCase()) {
    case 'visa':
      return 'Visa';
    case 'mastercard':
      return 'Mastercard';
    case 'amex':
    case 'american_express':
      return 'American Express';
    case 'discover':
      return 'Discover';
    case 'jcb':
      return 'JCB';
    case 'diners':
    case 'diners_club':
      return 'Diners';
    case 'unionpay':
      return 'UnionPay';
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

function formatExpiry(month: number, year: number): string {
  const mm = String(month).padStart(2, '0');
  const yy = String(year).slice(-2);
  return `${mm}/${yy}`;
}

interface SavedCardsManagerProps {
  /**
   * Accent color used for primary CTAs and selected states. Defaults to the
   * client (crimson) brand. Owner profile pages pass the teal variant.
   */
  accent?: string;
  /** Hover variant of `accent`. */
  accentHover?: string;
}

/**
 * Account-level Stripe saved cards manager — surfaced on `/profile` and
 * `/owner/profile`. Lists every PaymentMethod attached to the user's
 * Stripe Customer, lets them set a default, delete one, or attach a new
 * card via the Stripe SetupIntent flow (no charge).
 */
export default function SavedCardsManager({
  accent = brand.primary,
  accentHover = brand.primaryDark,
}: SavedCardsManagerProps): React.ReactElement {
  const queryClient = useQueryClient();
  const [setupOpen, setSetupOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: cards,
    isLoading,
    isError,
    refetch,
  } = useQuery<StripePaymentMethod[]>({
    queryKey: STRIPE_SAVED_CARDS_QUERY_KEY,
    queryFn: () => paymentsService.listStripePaymentMethods(),
    staleTime: 60_000,
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsService.deleteStripePaymentMethod(id),
    onMutate: (id) => {
      setDeletingId(id);
      setErrorMessage(null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: STRIPE_SAVED_CARDS_QUERY_KEY,
      });
    },
    onError: () => {
      setErrorMessage(
        'Impossible de supprimer cette carte. Réessayez dans un instant.'
      );
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) =>
      paymentsService.setDefaultStripePaymentMethod(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: STRIPE_SAVED_CARDS_QUERY_KEY,
      });
    },
    onError: () => {
      setErrorMessage(
        'Impossible de définir cette carte par défaut. Réessayez.'
      );
    },
  });

  const handleAddCardSuccess = useCallback(() => {
    setSetupOpen(false);
    void queryClient.invalidateQueries({
      queryKey: STRIPE_SAVED_CARDS_QUERY_KEY,
    });
    void paymentsService.notifyCardAdded().catch((err: unknown) => {
      console.warn('Card-added notification failed (non-blocking)', err);
    });
  }, [queryClient]);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          flexDirection: { xs: 'column', sm: 'row' },
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Moyens de paiement enregistrés
          </Typography>
          <Typography variant="body2" color="text.secondary">
            les cartes enregistrées vous permettent de payer plus rapidement
            sans devoir rentrer vos coordonnées à chaque fois. Vous pouvez en
            supprimer une à tout moment.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setErrorMessage(null);
            setSetupOpen(true);
          }}
          sx={{
            bgcolor: accent,
            color: 'white',
            fontWeight: 700,
            borderRadius: 3,
            px: 2.5,
            py: 1.1,
            flexShrink: 0,
            '&:hover': { bgcolor: accentHover },
          }}
        >
          Ajouter une carte
        </Button>
      </Box>

      {errorMessage && (
        <AppAlert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setErrorMessage(null)}
          message={errorMessage}
        />
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: accent }} size={28} />
        </Box>
      )}

      {isError && (
        <AppAlert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Réessayer
            </Button>
          }
          message="Impossible de récupérer vos cartes enregistrées pour le moment."
        />
      )}

      {!isLoading && !isError && cards && cards.length === 0 && (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2.5,
            py: 4,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <CreditCardIcon sx={{ fontSize: 36, opacity: 0.5, mb: 1 }} />
          <Typography variant="body2">
            Aucune carte enregistrée pour le moment.
          </Typography>
        </Box>
      )}

      {!isLoading && !isError && cards && cards.length > 0 && (
        <List sx={{ p: 0 }}>
          {cards.map((card) => {
            const isDefault = card.is_default;
            const isDeleting = deletingId === card.id;
            return (
              <ListItem
                key={card.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  border: '1px solid',
                  borderColor: isDefault ? accent : 'divider',
                  borderRadius: 2.5,
                  px: 2,
                  py: 1.5,
                  mb: 1,
                  bgcolor: isDefault ? `${accent}10` : 'transparent',
                  transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <CreditCardIcon
                  sx={{ color: isDefault ? accent : 'text.secondary' }}
                  aria-hidden
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {brandLabel(card.brand)} •••• {card.last4}
                    {isDefault && (
                      <Typography
                        component="span"
                        sx={{
                          ml: 1,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: accent,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        · Par défaut
                      </Typography>
                    )}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', fontSize: '0.75rem' }}
                  >
                    Expire {formatExpiry(card.exp_month, card.exp_year)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip
                    title={
                      isDefault ? 'Carte par défaut' : 'Définir par défaut'
                    }
                  >
                    <span>
                      <IconButton
                        aria-label={
                          isDefault
                            ? 'Carte par défaut'
                            : 'Définir cette carte par défaut'
                        }
                        size="small"
                        disabled={isDefault || setDefaultMutation.isPending}
                        onClick={() => setDefaultMutation.mutate(card.id)}
                        sx={{ color: isDefault ? accent : 'text.secondary' }}
                      >
                        {isDefault ? (
                          <StarIcon fontSize="small" />
                        ) : (
                          <StarBorderIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Supprimer cette carte">
                    <span>
                      <IconButton
                        aria-label="Supprimer cette carte"
                        size="small"
                        disabled={isDeleting}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Supprimer la carte ${brandLabel(card.brand)} •••• ${card.last4} ?`
                            )
                          ) {
                            deleteMutation.mutate(card.id);
                          }
                        }}
                        sx={{ color: '#D32F2F' }}
                      >
                        {isDeleting ? (
                          <CircularProgress
                            size={16}
                            sx={{ color: '#D32F2F' }}
                          />
                        ) : (
                          <DeleteOutlineIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}

      <AddCardDialog
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onSuccess={handleAddCardSuccess}
        accent={accent}
        accentHover={accentHover}
      />
    </Box>
  );
}

// ─── Add-card dialog ────────────────────────────────────────────────────

interface AddCardDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accent: string;
  accentHover: string;
}

/**
 * Dialog that drives the Stripe SetupIntent flow:
 *  1. On open, fetch a fresh client secret from
 *     `POST /payments/stripe/setup-intent`.
 *  2. Mount `<Elements>` + `<PaymentElement>` configured for setup mode.
 *  3. Call `stripe.confirmSetup` on submit.
 *  4. On success, refresh the parent list (the new PaymentMethod is now
 *     attached to the user's Stripe Customer).
 */
function AddCardDialog({
  open,
  onClose,
  onSuccess,
  accent,
  accentHover,
}: AddCardDialogProps): React.ReactElement {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const stripePromise = useMemo(() => getStripePromise(), []);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const setupQuery = useQuery({
    queryKey: ['payments', 'stripe', 'setup-intent', open],
    queryFn: () => paymentsService.createStripeSetupIntent(),
    enabled: open && clientSecret === null,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setSetupError(null);
      return;
    }
    if (setupQuery.data?.client_secret) {
      setClientSecret(setupQuery.data.client_secret);
    }
    if (setupQuery.isError) {
      setSetupError(
        "Impossible de préparer le formulaire d'ajout de carte. Réessayez."
      );
    }
  }, [open, setupQuery.data, setupQuery.isError]);

  const handleClose = () => {
    setClientSecret(null);
    setSetupError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(e, reason): void => {
        if (isImplicitDialogDismissReason(reason)) {
          return;
        }
        handleClose();
      }}
      disableEscapeKeyDown
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      sx={{ zIndex: (t) => t.zIndex.modal + 2 }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          p: isMobile ? 0 : 1,
          bgcolor: 'background.default',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Ajouter une carte</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {
            "Votre carte sera enregistrée en toute sécurité chez Stripe. Aucune somme ne sera prélevée à l'enregistrement."
          }
        </Typography>

        {setupQuery.isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: accent }} size={28} />
          </Box>
        )}

        {setupError && <AppAlert severity="error" message={setupError} />}

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              locale: 'fr',
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: accent,
                  colorBackground: '#ffffff',
                  colorText: '#0A1628',
                  borderRadius: '10px',
                },
              },
              loader: 'auto',
            }}
          >
            <AddCardForm
              onSuccess={onSuccess}
              onCancel={handleClose}
              accent={accent}
              accentHover={accentHover}
            />
          </Elements>
        )}
      </DialogContent>
      {!clientSecret && !setupQuery.isLoading && (
        <DialogActions>
          <Button onClick={handleClose}>Fermer</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

function AddCardForm({
  onSuccess,
  onCancel,
  accent,
  accentHover,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  accent: string;
  accentHover: string;
}): React.ReactElement {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const result = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    });
    if (result.error) {
      setError(
        result.error.message ??
          "L'enregistrement de la carte a échoué. Réessayez."
      );
      setSubmitting(false);
      return;
    }
    if (
      result.setupIntent &&
      (result.setupIntent.status === 'succeeded' ||
        result.setupIntent.status === 'processing')
    ) {
      onSuccess();
      return;
    }
    setError(
      "Stripe a accepté la carte mais l'enregistrement n'a pas été finalisé."
    );
    setSubmitting(false);
  }, [stripe, elements, onSuccess]);

  return (
    <Box>
      <Box sx={{ mb: 2, minHeight: 100 }}>
        {!ready && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 2,
            }}
          >
            <CircularProgress size={22} sx={{ color: accent }} />
          </Box>
        )}
        <PaymentElement
          options={{ layout: 'tabs' }}
          onReady={() => setReady(true)}
        />
      </Box>

      {error && <AppAlert severity="error" sx={{ mb: 1.5 }} message={error} />}

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={submitting}
          sx={{ flex: 1, py: 1.4, borderRadius: 3, fontWeight: 600 }}
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!stripe || !elements || !ready || submitting}
          sx={{
            flex: 2,
            py: 1.4,
            borderRadius: 3,
            fontWeight: 700,
            bgcolor: accent,
            color: 'white',
            '&:hover': { bgcolor: accentHover },
          }}
        >
          {submitting ? (
            <CircularProgress
              size={20}
              sx={{ color: 'rgba(255,255,255,0.5)' }}
            />
          ) : (
            'Enregistrer la carte'
          )}
        </Button>
      </Box>
    </Box>
  );
}
