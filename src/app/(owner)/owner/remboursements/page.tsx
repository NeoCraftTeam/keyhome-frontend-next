'use client';

import FadeIn from '@/components/ui/FadeIn';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { paymentsService } from '@/services/payments.service';
import { PaymentHistoryItem, UserRefund } from '@/types';
import AccessTime from '@mui/icons-material/AccessTime';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
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
  DialogTitle,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const STATUS_CONFIG: Record<
  UserRefund['status'],
  {
    label: string;
    color: 'success' | 'error' | 'warning' | 'default';
    icon: React.ReactElement;
  }
> = {
  pending: {
    label: 'En attente',
    color: 'default',
    icon: <AccessTime sx={{ fontSize: 14 }} />,
  },
  completed: {
    label: 'Remboursé',
    color: 'success',
    icon: <CheckCircleOutline sx={{ fontSize: 14 }} />,
  },
  failed: {
    label: 'Échoué',
    color: 'error',
    icon: <ErrorOutline sx={{ fontSize: 14 }} />,
  },
  processing: {
    label: 'En cours',
    color: 'warning',
    icon: <HourglassEmpty sx={{ fontSize: 14 }} />,
  },
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  subscription: 'Abonnement',
  credit: 'Crédits',
  unlock: 'Déverrouillage',
  boost: 'Boost annonce',
};

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
}

export default function OwnerRemboursementsPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [reason, setReason] = useState('');
  const [snackbar, setSnackbar] = useState<{ msg: string; ok: boolean } | null>(
    null
  );
  const queryClient = useQueryClient();

  const { data: paymentsData } = useQuery({
    queryKey: ['owner-payments-history-refund'],
    queryFn: () => paymentsService.getHistory({ perPage: 50 }),
    staleTime: 5 * 60 * 1000,
    enabled: dialogOpen,
  });

  const requestMutation = useMutation({
    mutationFn: () => paymentsService.requestRefund(selectedPaymentId, reason),
    onSuccess: (res) => {
      setSnackbar({ msg: res.message, ok: true });
      setDialogOpen(false);
      setSelectedPaymentId('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['owner-refunds'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setSnackbar({
        msg: err?.response?.data?.message ?? 'Une erreur est survenue.',
        ok: false,
      });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['owner-refunds', page],
    queryFn: () => paymentsService.fetchRefunds(page),
    staleTime: 2 * 60 * 1000,
  });

  const refunds = data?.data ?? [];
  const meta = data?.meta;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Remboursements' },
          ]}
        />
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Mes remboursements
        </Typography>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Typography color="text.secondary">
            Suivez l&apos;état de vos remboursements traités par l&apos;équipe
            KeyHome.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => setDialogOpen(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            Nouvelle demande
          </Button>
        </Stack>
      </FadeIn>

      {isLoading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={90}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Stack>
      ) : refunds.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            p: { xs: 4, md: 6 },
            textAlign: 'center',
          }}
        >
          <ReceiptLong sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Aucun remboursement
          </Typography>
          <Typography color="text.secondary">
            Vous n&apos;avez pas encore de remboursement enregistré.
          </Typography>
        </Card>
      ) : (
        <>
          <Stack spacing={1.5}>
            {refunds.map((refund) => {
              const statusCfg =
                STATUS_CONFIG[refund.status] ?? STATUS_CONFIG.processing;
              return (
                <Card
                  key={refund.id}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <CardContent sx={{ py: '14px !important', px: 2 }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={1}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          <Typography fontWeight={700} sx={{ fontSize: 15 }}>
                            {formatAmount(refund.amount, refund.currency)}
                          </Typography>
                          {refund.is_partial && (
                            <Chip
                              label="Partiel"
                              size="small"
                              sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                            />
                          )}
                          {refund.payment?.type && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {PAYMENT_TYPE_LABELS[refund.payment.type] ??
                                refund.payment.type}
                            </Typography>
                          )}
                        </Stack>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.25,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {refund.reason}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {new Date(refund.created_at).toLocaleDateString(
                            'fr-FR',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </Typography>
                      </Box>
                      <Chip
                        icon={statusCfg.icon}
                        label={statusCfg.label}
                        color={statusCfg.color}
                        size="small"
                        sx={{ fontWeight: 700, flexShrink: 0 }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          {meta && meta.last_page > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={meta.last_page}
                page={page}
                onChange={(_, v) => {
                  setPage(v);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}
      {/* --- Dialog nouvelle demande --- */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Nouvelle demande de remboursement
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Select
              displayEmpty
              value={selectedPaymentId}
              onChange={(e) => setSelectedPaymentId(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="" disabled>
                Sélectionner un paiement…
              </MenuItem>
              {(paymentsData?.data ?? []).map((p: PaymentHistoryItem) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.reference ?? p.id.slice(0, 8)} —{' '}
                  {p.amount.toLocaleString('fr-FR')} XAF
                </MenuItem>
              ))}
            </Select>
            <TextField
              label="Motif de la demande (min. 10 caractères)"
              multiline
              minRows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              inputProps={{ maxLength: 1000 }}
              size="small"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            disabled={
              !selectedPaymentId ||
              reason.length < 10 ||
              requestMutation.isPending
            }
            onClick={() => requestMutation.mutate()}
            sx={{ textTransform: 'none', fontWeight: 700 }}
            startIcon={
              requestMutation.isPending ? (
                <CircularProgress size={14} color="inherit" />
              ) : null
            }
          >
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={5000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar?.ok ? 'success' : 'error'}
          onClose={() => setSnackbar(null)}
          variant="filled"
        >
          {snackbar?.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
