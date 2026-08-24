'use client';

import KhSnackbar from '@/components/ui/feedback/KhSnackbar';
import {
  ownerService,
  type RentPayment,
  type RentPaymentPayload,
} from '@/services/owner.service';
import { getSafeErrorMessage } from '@/lib/error-messages';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Payments as PaymentsIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

interface RentPaymentsSectionProps {
  adId: string;
}

const PAYMENT_METHOD_LABELS: Record<RentPayment['payment_method'], string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Virement',
  other: 'Autre',
};

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR') + ' XAF';
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function firstOfThisMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function emptyForm(): RentPaymentPayload {
  return {
    period_month: firstOfThisMonthIso(),
    amount: 0,
    payment_method: 'mobile_money',
    received_at: todayIso(),
    notes: '',
  };
}

/**
 * Rent collection ledger UI scoped to a selected ad.
 *
 * Resolves the lease contracts for the ad (client-side filter from the
 * `/my/lease-contracts` index), lets the landlord pick one when several
 * exist, and exposes add/delete operations. Rent collection in CEMAC is
 * mostly out-of-band (cash / mobile money / bank transfer) so this is a
 * manual ledger — see {@link RentPayment} for the data model rationale.
 */
export default function RentPaymentsSection({
  adId,
}: RentPaymentsSectionProps): ReactElement | null {
  const queryClient = useQueryClient();
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<RentPaymentPayload>(() => emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<RentPayment | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  // All leases for the landlord, then filter by ad. This is cached across
  // ad switches and small enough that paginated server-side filtering is
  // overkill (typical landlord = a few dozen leases at most).
  const { data: leasesData, isLoading: leasesLoading } = useQuery({
    queryKey: ['owner-lease-contracts', 'all'],
    queryFn: ({ signal }) =>
      ownerService.getLeaseContracts({ per_page: 100 }, { signal }),
  });

  const leasesForAd = useMemo(
    () => (leasesData?.data ?? []).filter((l) => l.ad_id === adId),
    [leasesData, adId]
  );

  // Auto-pick when there's exactly one lease, reset when the ad changes.
  useEffect(() => {
    setPage(1);
    if (leasesForAd.length === 1) {
      setSelectedLeaseId(leasesForAd[0]!.id);
    } else if (
      selectedLeaseId &&
      !leasesForAd.find((l) => l.id === selectedLeaseId)
    ) {
      setSelectedLeaseId('');
    }
  }, [adId, leasesForAd, selectedLeaseId]);

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['owner-rent-payments', selectedLeaseId, page],
    queryFn: ({ signal }) =>
      ownerService.getRentPayments(selectedLeaseId, { page }, { signal }),
    enabled: Boolean(selectedLeaseId),
  });

  const payments = paymentsData?.data ?? [];
  const meta = paymentsData?.meta;

  const createMutation = useMutation({
    mutationFn: (payload: RentPaymentPayload) =>
      ownerService.createRentPayment(selectedLeaseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner-rent-payments', selectedLeaseId],
      });
      // Dashboard KPI consumes rent_collected_xaf_30d.
      queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
      setAddOpen(false);
      setForm(emptyForm());
      setSnackbar({ message: 'Loyer enregistré', severity: 'success' });
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getSafeErrorMessage(err) || "Erreur lors de l'enregistrement",
        severity: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ownerService.deleteRentPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner-rent-payments', selectedLeaseId],
      });
      queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
      setDeleteTarget(null);
      setSnackbar({ message: 'Loyer supprimé', severity: 'success' });
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getSafeErrorMessage(err) || 'Erreur lors de la suppression',
        severity: 'error',
      });
    },
  });

  if (leasesLoading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (leasesForAd.length === 0) {
    return (
      <Card
        sx={{
          borderRadius: 3,
          border: '1px dashed',
          borderColor: 'divider',
          p: 4,
          textAlign: 'center',
          mb: 3,
        }}
      >
        <PaymentsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Aucun contrat de bail pour ce bien
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Créez un contrat de bail pour suivre les loyers encaissés (espèces,
          Mobile Money, virement).
        </Typography>
      </Card>
    );
  }

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 4, mb: 2, gap: 2, flexWrap: 'wrap', minWidth: 0 }}
      >
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ minWidth: 0, flex: '1 1 200px' }}
        >
          Loyers encaissés
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setForm(emptyForm());
            setAddOpen(true);
          }}
          disabled={!selectedLeaseId || createMutation.isPending}
          sx={{ borderRadius: 2, textTransform: 'none', flexShrink: 0 }}
        >
          Enregistrer un loyer
        </Button>
      </Stack>

      {leasesForAd.length > 1 && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="lease-select-label">
            Contrat de bail concerné
          </InputLabel>
          <Select
            labelId="lease-select-label"
            value={selectedLeaseId}
            label="Contrat de bail concerné"
            onChange={(e) => {
              setSelectedLeaseId(e.target.value);
              setPage(1);
            }}
          >
            {leasesForAd.map((lease) => (
              <MenuItem key={lease.id} value={lease.id}>
                {lease.contract_number} — {lease.tenant_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {!selectedLeaseId ? (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography color="text.secondary">
            Sélectionnez un contrat de bail pour voir les loyers encaissés.
          </Typography>
        </Card>
      ) : paymentsLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={72}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      ) : payments.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography color="text.secondary">
            Aucun loyer encaissé enregistré pour ce contrat.
          </Typography>
        </Card>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {payments.map((payment) => (
              <Card
                key={payment.id}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CardContent sx={{ py: '12px !important', px: 2 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography fontWeight={700} color="success.main">
                          {formatCurrency(payment.amount)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: 'action.selected',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontWeight: 600,
                          }}
                        >
                          {PAYMENT_METHOD_LABELS[payment.payment_method]}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.25 }}
                      >
                        Période :{' '}
                        {new Date(payment.period_month).toLocaleDateString(
                          'fr-FR',
                          { month: 'long', year: 'numeric' }
                        )}
                      </Typography>
                      {payment.notes && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            mt: 0.25,
                          }}
                          title={payment.notes}
                        >
                          {payment.notes}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.disabled">
                        Reçu le{' '}
                        {new Date(payment.received_at).toLocaleDateString(
                          'fr-FR',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </Typography>
                    </Box>
                    <Tooltip title="Supprimer">
                      <IconButton
                        aria-label="Supprimer ce loyer"
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(payment)}
                        disabled={deleteMutation.isPending}
                        sx={{ borderRadius: 1.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          {meta && meta.last_page > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={meta.last_page}
                page={page}
                onChange={(_, value) => {
                  setPage(value);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      {/* Add rent payment dialog */}
      <Dialog
        open={addOpen}
        onClose={() => {
          if (createMutation.isPending) return;
          setAddOpen(false);
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Enregistrer un loyer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Montant (XAF) *"
              type="number"
              value={form.amount || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: Number(e.target.value) }))
              }
              fullWidth
              autoFocus
              inputProps={{ min: 1 }}
            />
            <FormControl fullWidth>
              <InputLabel id="payment-method-label">
                Mode de paiement *
              </InputLabel>
              <Select
                labelId="payment-method-label"
                value={form.payment_method}
                label="Mode de paiement *"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment_method: e.target
                      .value as RentPayment['payment_method'],
                  }))
                }
              >
                {(
                  Object.keys(PAYMENT_METHOD_LABELS) as Array<
                    RentPayment['payment_method']
                  >
                ).map((method) => (
                  <MenuItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Mois locatif couvert *"
              type="month"
              value={form.period_month.slice(0, 7)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  period_month: `${e.target.value}-01`,
                }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Le mois auquel se rapporte ce loyer (paiements partiels possibles)."
            />
            <TextField
              label="Date de réception *"
              type="date"
              value={form.received_at}
              onChange={(e) =>
                setForm((f) => ({ ...f, received_at: e.target.value }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: todayIso() }}
            />
            <TextField
              label="Notes (référence transaction, etc.)"
              value={form.notes ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={() => setAddOpen(false)}
            variant="outlined"
            disabled={createMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => createMutation.mutate(form)}
            variant="contained"
            disabled={
              createMutation.isPending ||
              !form.amount ||
              !form.period_month ||
              !form.received_at
            }
            startIcon={
              createMutation.isPending ? <CircularProgress size={16} /> : null
            }
            sx={{ borderRadius: 2 }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (deleteMutation.isPending) return;
          setDeleteTarget(null);
        }}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Supprimer ce loyer ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Supprimer le loyer de{' '}
            <strong>
              {deleteTarget ? formatCurrency(deleteTarget.amount) : ''}
            </strong>{' '}
            ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            variant="outlined"
            disabled={deleteMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() =>
              deleteTarget && deleteMutation.mutate(deleteTarget.id)
            }
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            startIcon={
              deleteMutation.isPending ? <CircularProgress size={16} /> : null
            }
            sx={{ borderRadius: 2 }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <KhSnackbar
        open={Boolean(snackbar)}
        message={snackbar?.message ?? null}
        severity={snackbar?.severity ?? 'success'}
        onClose={() => setSnackbar(null)}
        duration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
