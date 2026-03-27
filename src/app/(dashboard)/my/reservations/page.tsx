'use client';

import FadeIn from '@/components/ui/FadeIn';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { viewingsService } from '@/services/viewings.service';
import { gradient } from '@/theme/tokens';
import { CancelledBy, Reservation, ReservationStatus } from '@/types';
import {
  CalendarMonth,
  Cancel as CancelIcon,
  CheckCircle,
  ChevronLeft as ChevronLeftIcon,
  ErrorOutline,
  HourglassTop,
  OpenInNew,
  Schedule,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatTime = (t: string) => t.slice(0, 5);

function statusConfig(status: ReservationStatus, isDark?: boolean) {
  switch (status) {
    case ReservationStatus.Confirmed:
      return {
        label: 'Confirmée',
        color: '#15803d',
        darkColor: '#4ade80',
        bg: isDark ? 'rgba(74,222,128,0.12)' : '#f0fdf4',
        border: isDark ? 'rgba(74,222,128,0.3)' : '#86efac',
        icon: <CheckCircle sx={{ fontSize: 14 }} />,
      };
    case ReservationStatus.Pending:
      return {
        label: 'En attente',
        color: '#b45309',
        darkColor: '#fbbf24',
        bg: isDark ? 'rgba(251,191,36,0.12)' : '#fffbeb',
        border: isDark ? 'rgba(251,191,36,0.3)' : '#fcd34d',
        icon: <HourglassTop sx={{ fontSize: 14 }} />,
      };
    case ReservationStatus.Cancelled:
      return {
        label: 'Annulée',
        color: '#b91c1c',
        darkColor: '#f87171',
        bg: isDark ? 'rgba(248,113,113,0.12)' : '#fef2f2',
        border: isDark ? 'rgba(248,113,113,0.3)' : '#fca5a5',
        icon: <CancelIcon sx={{ fontSize: 14 }} />,
      };
    case ReservationStatus.Expired:
      return {
        label: 'Expirée',
        color: '#64748b',
        darkColor: '#94a3b8',
        bg: isDark ? 'rgba(148,163,184,0.12)' : '#f8fafc',
        border: isDark ? 'rgba(148,163,184,0.25)' : '#cbd5e1',
        icon: <ErrorOutline sx={{ fontSize: 14 }} />,
      };
  }
}

// ─── sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReservationStatus }) {
  const { palette } = useTheme();
  const isDark = palette.mode === 'dark';
  const cfg = statusConfig(status, isDark);
  const textColor = isDark ? cfg.darkColor : cfg.color;
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      size="small"
      sx={{
        backgroundColor: cfg.bg,
        color: textColor,
        border: `1px solid ${cfg.border}`,
        fontWeight: 700,
        fontSize: '0.72rem',
        '& .MuiChip-icon': { color: textColor },
      }}
    />
  );
}

function ReservationCard({
  r,
  onCancel,
}: {
  r: Reservation;
  onCancel: (r: Reservation) => void;
}) {
  const canCancel =
    r.status === ReservationStatus.Pending ||
    r.status === ReservationStatus.Confirmed;
  const slotDate = parseISO(r.slot_date);
  const adSlug = r.ad ? `/ads/${r.ad.id}/${r.ad.slug}` : null;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 3 },
      }}
    >
      {/* Coloured top stripe by status */}
      <Box
        sx={{
          height: 4,
          background:
            r.status === ReservationStatus.Confirmed
              ? 'linear-gradient(90deg,#15803d,#0D9488)'
              : r.status === ReservationStatus.Pending
                ? 'linear-gradient(90deg,#d97706,#f59e0b)'
                : r.status === ReservationStatus.Cancelled
                  ? 'linear-gradient(90deg,#b91c1c,#ef4444)'
                  : 'linear-gradient(90deg,#94a3b8,#cbd5e1)',
        }}
      />

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* header row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              noWrap
              sx={{ color: 'text.primary', maxWidth: 340 }}
            >
              {r.ad?.title ?? 'Annonce inconnue'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.25 }}
            >
              {r.ad?.quarter?.city_name ?? r.ad?.adresse ?? ''}
            </Typography>
          </Box>
          <StatusBadge status={r.status} />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* date + time */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'primary.main',
                opacity: 0.85,
              }}
            >
              <CalendarMonth sx={{ fontSize: 17 }} />
            </Avatar>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Date
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {format(slotDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'secondary.main',
                opacity: 0.85,
              }}
            >
              <Schedule sx={{ fontSize: 17 }} />
            </Avatar>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Horaire
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatTime(r.slot_starts_at)} – {formatTime(r.slot_ends_at)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* client message */}
        {r.client_message && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
              borderLeft: '3px solid',
              borderColor: 'primary.main',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Votre message
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {r.client_message}
            </Typography>
          </Box>
        )}

        {/* landlord notes */}
        {r.landlord_notes && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: (t) =>
                t.palette.mode === 'dark' ? 'rgba(13,148,136,0.12)' : '#f0fdf4',
              borderLeft: '3px solid #0D9488',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: (t) =>
                  t.palette.mode === 'dark' ? '#2dd4bf' : '#0D9488',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Note du propriétaire
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: (t) =>
                  t.palette.mode === 'dark' ? '#2dd4bf' : '#0D9488',
                mt: 0.5,
              }}
            >
              {r.landlord_notes}
            </Typography>
          </Box>
        )}

        {/* cancellation reason */}
        {r.status === ReservationStatus.Cancelled && r.cancellation_reason && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: (t) =>
                t.palette.mode === 'dark' ? 'rgba(239,68,68,0.12)' : '#fef2f2',
              borderLeft: '3px solid #ef4444',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: (t) =>
                  t.palette.mode === 'dark' ? '#f87171' : '#b91c1c',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Motif d&apos;annulation
              {r.cancelled_by === CancelledBy.Landlord
                ? ' (propriétaire)'
                : r.cancelled_by === CancelledBy.System
                  ? ' (système)'
                  : ''}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: (t) =>
                  t.palette.mode === 'dark' ? '#fca5a5' : '#7f1d1d',
                mt: 0.5,
              }}
            >
              {r.cancellation_reason}
            </Typography>
          </Box>
        )}

        {/* footer actions */}
        <Box
          sx={{
            mt: 2.5,
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {adSlug && (
            <Button
              component={Link}
              href={adSlug}
              size="small"
              variant="outlined"
              endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Voir l&apos;annonce
            </Button>
          )}
          {canCancel && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => onCancel(r)}
              startIcon={<CancelIcon sx={{ fontSize: 14 }} />}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Annuler
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

function ReservationSkeleton() {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Skeleton variant="rectangular" height={4} />
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Skeleton width={200} height={24} />
            <Skeleton width={120} height={18} sx={{ mt: 0.5 }} />
          </Box>
          <Skeleton width={80} height={26} sx={{ borderRadius: 4 }} />
        </Box>
        <Skeleton height={1} sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Skeleton width={160} height={40} />
          <Skeleton width={140} height={40} />
        </Box>
      </Box>
    </Paper>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

const TAB_ALL = 'all';
const TAB_ACTIVE = 'active';
const TAB_PAST = 'past';

export default function MyReservationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState(TAB_ACTIVE);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const {
    data: reservations,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-reservations-page'],
    queryFn: () => viewingsService.myReservations(),
    staleTime: 60_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (r: Reservation) =>
      viewingsService.cancel(r.ad?.id ?? '', r.id, cancelReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations-page'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      setCancelTarget(null);
      setCancelReason('');
    },
  });

  // ── filtering ──
  const filtered = (reservations ?? []).filter((r) => {
    if (tab === TAB_ACTIVE) {
      return (
        r.status === ReservationStatus.Pending ||
        r.status === ReservationStatus.Confirmed
      );
    }
    if (tab === TAB_PAST) {
      return (
        r.status === ReservationStatus.Cancelled ||
        r.status === ReservationStatus.Expired
      );
    }
    return true;
  });

  const sortedFiltered = [...filtered].sort(
    (a, b) => new Date(b.slot_date).getTime() - new Date(a.slot_date).getTime()
  );

  const activeCount = (reservations ?? []).filter(
    (r) =>
      r.status === ReservationStatus.Pending ||
      r.status === ReservationStatus.Confirmed
  ).length;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <FadeIn>
        {/* page header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <IconButton
              onClick={() => router.back()}
              size="small"
              aria-label="Retour"
              sx={{ border: '1px solid', borderColor: 'divider', mr: 0.5 }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={800} color="text.primary">
              Mes réservations
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Retrouvez ici toutes vos demandes de visite et leur statut.
          </Typography>
        </Box>

        {/* tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 44,
            },
            '& .MuiTabs-indicator': { backgroundColor: 'primary.main' },
          }}
        >
          <Tab
            value={TAB_ACTIVE}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                Actives
                {activeCount > 0 && (
                  <Box
                    sx={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: 0.5,
                    }}
                  >
                    {activeCount}
                  </Box>
                )}
              </Box>
            }
          />
          <Tab value={TAB_PAST} label="Passées" />
          <Tab value={TAB_ALL} label="Toutes" />
        </Tabs>

        {/* content */}
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[0, 1, 2].map((i) => (
              <ReservationSkeleton key={i} />
            ))}
          </Box>
        ) : isError ? (
          <Alert
            severity="error"
            action={
              <Button size="small" onClick={() => refetch()}>
                Réessayer
              </Button>
            }
          >
            {getSafeErrorMessage(error, 'Impossible de charger vos visites.')}
          </Alert>
        ) : sortedFiltered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CalendarMonth
              sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }}
            />
            <Typography
              variant="h6"
              fontWeight={700}
              color="text.secondary"
              gutterBottom
            >
              {tab === TAB_ACTIVE
                ? 'Aucune visite active'
                : tab === TAB_PAST
                  ? 'Aucune visite passée'
                  : 'Aucune visite'}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {tab === TAB_ACTIVE
                ? 'Réservez un créneau sur une annonce pour planifier votre prochaine visite.'
                : 'Vos visites passées apparaîtront ici.'}
            </Typography>
            {tab === TAB_ACTIVE && (
              <Button
                component={Link}
                href="/home"
                variant="contained"
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  background: gradient.primary,
                  '&:hover': { background: gradient.primaryHover },
                }}
              >
                Parcourir les annonces
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sortedFiltered.map((r) => (
              <ReservationCard key={r.id} r={r} onCancel={setCancelTarget} />
            ))}
          </Box>
        )}
      </FadeIn>

      {/* cancel dialog */}
      <Dialog
        open={!!cancelTarget}
        onClose={() => {
          setCancelTarget(null);
          setCancelReason('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Annuler la visite</DialogTitle>
        <DialogContent>
          {cancelTarget && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>{cancelTarget.ad?.title}</strong> ·{' '}
                {format(parseISO(cancelTarget.slot_date), 'EEEE d MMMM yyyy', {
                  locale: fr,
                })}
                {' · '}
                {formatTime(cancelTarget.slot_starts_at)} –{' '}
                {formatTime(cancelTarget.slot_ends_at)}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Motif d'annulation (optionnel)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                sx={{ mt: 2 }}
              />
              {cancelMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {getSafeErrorMessage(
                    cancelMutation.error,
                    "Impossible d'annuler la visite."
                  )}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setCancelTarget(null);
              setCancelReason('');
            }}
            variant="outlined"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Retour
          </Button>
          <Button
            onClick={() => cancelTarget && cancelMutation.mutate(cancelTarget)}
            variant="contained"
            color="error"
            disabled={cancelMutation.isPending}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {cancelMutation.isPending ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              "Confirmer l'annulation"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
