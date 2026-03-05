'use client';

import { getSafeErrorMessage } from '@/lib/error-messages';
import { useAuth } from '@/providers/AuthProvider';
import { viewingsService } from '@/services/viewings.service';
import { type BookableSlot, CancelledBy, type Reservation, ReservationStatus } from '@/types';
import {
  AccessTime,
  CalendarMonth,
  CalendarToday,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Close,
  EventAvailable,
  EventBusy,
  Forum,
  KeyboardArrowRight,
  Refresh,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  startOfToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEffect, useState } from 'react';

// ─── constants ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; color: 'warning' | 'success' | 'error' | 'default' }
> = {
  [ReservationStatus.Pending]:   { label: 'En attente',  color: 'warning' },
  [ReservationStatus.Confirmed]: { label: 'Confirmée',   color: 'success' },
  [ReservationStatus.Cancelled]: { label: 'Annulée',     color: 'error'   },
  [ReservationStatus.Expired]:   { label: 'Expirée',     color: 'default' },
};

const WEEK_SIZE = 7;          // days visible in the strip
const MAX_BOOKING_DAYS = 45;  // how many days ahead to allow booking

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatSlot(time: string) {
  // "HH:MM" or "HH:MM:SS" → "HH:MM"
  return time.slice(0, 5);
}

function buildDateStrip(startDate: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(startDate, i));
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusChip({ status }: { status: ReservationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'default' as const };
  return (
    <Chip
      label={cfg.label}
      color={cfg.color}
      size="small"
      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
    />
  );
}

// ─── main props ───────────────────────────────────────────────────────────────

interface Props {
  adId: string;
  adTitle: string;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ViewingBookingPanel({ adId, adTitle }: Props) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Dialog open
  const [open, setOpen] = useState(false);

  // Tab: 0 = book, 1 = my reservations
  const [tab, setTab] = useState(0);

  // ── Booking step ─────────────────────────────────────────────────────────
  // 0=date, 1=slot, 2=message, 3=success
  const [step, setStep] = useState(0);

  // Selected date (Date object)
  const today = startOfToday();
  const maxDate = addDays(today, MAX_BOOKING_DAYS);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [message, setMessage] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Date strip navigation: which week is shown
  const [stripStart, setStripStart] = useState<Date>(today);

  // ── Cancel dialog ─────────────────────────────────────────────────────────
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  // Reset step when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(0);
        setSelectedDate(null);
        setSelectedSlot(null);
        setMessage('');
        setBookingError('');
        setStripStart(today);
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Slots query ───────────────────────────────────────────────────────────
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const {
    data: slots,
    isLoading: slotsLoading,
    isError: slotsError,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: ['slots', adId, dateStr],
    queryFn: () => viewingsService.getSlots(adId, dateStr),
    enabled: !!dateStr && open,
    staleTime: 60_000,
  });

  // ── My reservations query ─────────────────────────────────────────────────
  const {
    data: myReservations,
    isLoading: myResLoading,
    refetch: refetchMyRes,
  } = useQuery({
    queryKey: ['my-reservations', adId],
    queryFn: () => viewingsService.myReservations(adId),
    enabled: isAuthenticated && open,
    staleTime: 30_000,
  });

  // ── Create reservation mutation ────────────────────────────────────────────
  const { mutate: createReservation, isPending: isCreating } = useMutation({
    mutationFn: () =>
      viewingsService.reserve(adId, {
        slot_date:     dateStr,
        slot_starts_at: selectedSlot!.starts_at,
        slot_ends_at:   selectedSlot!.ends_at,
        client_message: message.trim() || undefined,
      }),
    onSuccess: () => {
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ['my-reservations', adId] });
      queryClient.invalidateQueries({ queryKey: ['slots', adId, dateStr] });
    },
    onError: (err) => {
      setBookingError(getSafeErrorMessage(err, 'Impossible de créer la réservation.'));
    },
  });

  // ── Cancel mutation ────────────────────────────────────────────────────────
  const { mutate: cancelReservation, isPending: isCancelling } = useMutation({
    mutationFn: () =>
      viewingsService.cancel(adId, cancelTarget!.id, cancelReason.trim() || undefined),
    onSuccess: () => {
      setCancelTarget(null);
      setCancelReason('');
      setCancelError('');
      queryClient.invalidateQueries({ queryKey: ['my-reservations', adId] });
      queryClient.invalidateQueries({ queryKey: ['slots', adId, dateStr] });
    },
    onError: (err) => {
      setCancelError(getSafeErrorMessage(err, 'Impossible d\'annuler cette réservation.'));
    },
  });

  // ─── date strip ────────────────────────────────────────────────────────────
  const strip = buildDateStrip(stripStart, WEEK_SIZE);
  const canGoPrev = isAfter(stripStart, today);
  const canGoNext = isBefore(addDays(stripStart, WEEK_SIZE), maxDate);

  function handlePrevWeek() {
    const newStart = addDays(stripStart, -WEEK_SIZE);
    setStripStart(isBefore(newStart, today) ? today : newStart);
  }
  function handleNextWeek() {
    const newStart = addDays(stripStart, WEEK_SIZE);
    if (!isAfter(newStart, maxDate)) { setStripStart(newStart); }
  }

  function handleDateSelect(d: Date) {
    setSelectedDate(d);
    setSelectedSlot(null);
    setBookingError('');
    setStep(1);
  }

  function handleSlotSelect(s: BookableSlot) {
    if (!s.is_available) { return; }
    setSelectedSlot(s);
    setStep(2);
  }

  // ─── render helpers ────────────────────────────────────────────────────────

  function renderDateStep() {
    return (
      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          Choisissez une date
        </Typography>

        {/* Week navigator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <IconButton
            size="small"
            onClick={handlePrevWeek}
            disabled={!canGoPrev}
            aria-label="Semaine précédente"
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'center', fontWeight: 500 }}>
            {format(strip[0], 'MMMM yyyy', { locale: fr })}
          </Typography>
          <IconButton
            size="small"
            onClick={handleNextWeek}
            disabled={!canGoNext}
            aria-label="Semaine suivante"
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>

        {/* Day strip */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
          {strip.map((d) => {
            const isPast   = isBefore(startOfDay(d), today);
            const isSel    = selectedDate ? isSameDay(d, selectedDate) : false;
            const isNow    = isToday(d);
            return (
              <Box
                key={d.toISOString()}
                onClick={() => !isPast && handleDateSelect(d)}
                aria-label={format(d, 'EEEE d MMMM', { locale: fr })}
                role={isPast ? undefined : 'button'}
                tabIndex={isPast ? -1 : 0}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isPast) { handleDateSelect(d); } }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 1,
                  borderRadius: 2,
                  cursor: isPast ? 'default' : 'pointer',
                  opacity: isPast ? 0.35 : 1,
                  bgcolor: isSel
                    ? 'primary.main'
                    : isNow
                    ? 'primary.50'
                    : 'action.hover',
                  border: '2px solid',
                  borderColor: isSel ? 'primary.main' : isNow ? 'primary.light' : 'transparent',
                  transition: 'all 0.15s',
                  '&:hover': !isPast ? { bgcolor: isSel ? 'primary.dark' : 'primary.100', borderColor: 'primary.light' } : {},
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: isSel ? 'primary.contrastText' : 'text.disabled',
                    lineHeight: 1.2,
                    textTransform: 'uppercase',
                    fontSize: '0.6rem',
                  }}
                >
                  {format(d, 'EEE', { locale: fr })}
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: isSel ? 'primary.contrastText' : 'text.primary',
                    lineHeight: 1.3,
                  }}
                >
                  {format(d, 'd')}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>
          Sélectionnez une date pour voir les créneaux disponibles
        </Typography>
      </Box>
    );
  }

  function renderSlotStep() {
    const available = (slots ?? []).filter((s) => s.is_available);
    const booked    = (slots ?? []).filter((s) => !s.is_available);

    return (
      <Box>
        {/* Back + date label */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton size="small" onClick={() => { setStep(0); setSelectedSlot(null); }} aria-label="Retour">
            <ChevronLeft fontSize="small" />
          </IconButton>
          <CalendarToday sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight={600}>
            {selectedDate ? format(selectedDate, 'EEEE d MMMM', { locale: fr }) : ''}
          </Typography>
        </Box>

        {slotsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {slotsError && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="error" variant="body2" gutterBottom>
              Impossible de charger les créneaux.
            </Typography>
            <Button size="small" startIcon={<Refresh />} onClick={() => refetchSlots()}>
              Réessayer
            </Button>
          </Box>
        )}

        {!slotsLoading && !slotsError && slots && (
          <>
            {available.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <EventBusy sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Aucun créneau disponible pour cette date.
                </Typography>
                <Button size="small" sx={{ mt: 1 }} onClick={() => setStep(0)}>
                  Choisir une autre date
                </Button>
              </Box>
            ) : (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
                  Créneaux disponibles ({available.length})
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75, mb: booked.length > 0 ? 2 : 0 }}>
                  {available.map((s) => {
                    const isSel = selectedSlot?.starts_at === s.starts_at;
                    return (
                      <Box
                        key={s.starts_at}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSlotSelect(s)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleSlotSelect(s); } }}
                        aria-pressed={isSel}
                        sx={{
                          py: 1,
                          px: 0.5,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: isSel ? 'primary.main' : 'divider',
                          bgcolor: isSel ? 'primary.main' : 'background.paper',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s',
                          '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, color: isSel ? 'primary.contrastText' : 'text.primary', display: 'block', lineHeight: 1.4 }}
                        >
                          {formatSlot(s.starts_at)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: isSel ? 'rgba(255,255,255,0.75)' : 'text.secondary', fontSize: '0.62rem' }}
                        >
                          — {formatSlot(s.ends_at)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {booked.length > 0 && (
                  <>
                    <Typography variant="caption" color="text.disabled" sx={{ mb: 0.5, display: 'block', fontWeight: 500 }}>
                      Déjà réservés ({booked.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {booked.map((s) => (
                        <Chip
                          key={s.starts_at}
                          label={`${formatSlot(s.starts_at)} – ${formatSlot(s.ends_at)}`}
                          size="small"
                          variant="outlined"
                          sx={{ opacity: 0.5, fontSize: '0.65rem' }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </>
            )}
          </>
        )}
      </Box>
    );
  }

  function renderMessageStep() {
    return (
      <Box>
        {/* Back + summary */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton size="small" onClick={() => setStep(1)} aria-label="Retour">
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Typography variant="subtitle2" fontWeight={600}>Votre visite</Typography>
        </Box>

        {/* Summary card */}
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(246,71,95,0.06)' : 'rgba(246,71,95,0.04)', borderColor: 'primary.light' }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth sx={{ fontSize: 15, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={600}>
                  {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime sx={{ fontSize: 15, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={600}>
                  {selectedSlot ? `${formatSlot(selectedSlot.starts_at)} – ${formatSlot(selectedSlot.ends_at)}` : ''}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        <TextField
          label="Message pour le propriétaire (optionnel)"
          multiline
          minRows={3}
          maxRows={5}
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          inputProps={{ maxLength: 500 }}
          helperText={`${message.length}/500 — Présentez-vous, précisez vos disponibilités, etc.`}
          sx={{ mb: 2 }}
          size="small"
        />

        {bookingError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {bookingError}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => createReservation()}
          disabled={isCreating}
          startIcon={isCreating ? <CircularProgress size={16} color="inherit" /> : <EventAvailable />}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            background: 'linear-gradient(to right,#F6475F,#D93A50)',
            '&:hover': { background: 'linear-gradient(to right,#E03E54,#C53248)' },
          }}
        >
          {isCreating ? 'Réservation en cours…' : 'Confirmer la visite'}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>
          Votre créneau est retenu 24h pendant que le propriétaire confirme.
        </Typography>
      </Box>
    );
  }

  function renderSuccessStep() {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Visite réservée !
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : ''}
          {selectedSlot ? ` · ${formatSlot(selectedSlot.starts_at)} – ${formatSlot(selectedSlot.ends_at)}` : ''}
        </Typography>

        <Alert icon={false} severity="success" sx={{ mt: 2, mb: 2, borderRadius: 2, textAlign: 'left' }}>
          <Typography variant="body2">
            Votre créneau est retenu pendant 24h. Le propriétaire vous contactera pour confirmer la visite. Assurez-vous d&apos;être joignable sur votre numéro enregistré.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setTab(1);
              setStep(0);
              setSelectedDate(null);
              setSelectedSlot(null);
              setMessage('');
              setBookingError('');
            }}
          >
            Voir mes visites
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setOpen(false);
            }}
            sx={{ background: 'linear-gradient(to right,#F6475F,#D93A50)', '&:hover': { background: 'linear-gradient(to right,#E03E54,#C53248)' } }}
          >
            Fermer
          </Button>
        </Box>
      </Box>
    );
  }

  function renderMyReservations() {
    if (!isAuthenticated) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Connectez-vous pour consulter vos visites.
          </Typography>
        </Box>
      );
    }

    if (myResLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      );
    }

    const reservations = myReservations ?? [];

    if (reservations.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <EventAvailable sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Vous n&apos;avez aucune visite planifiée pour cette annonce.
          </Typography>
          <Button
            size="small"
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => setTab(0)}
          >
            Réserver une visite
          </Button>
        </Box>
      );
    }

    const sortedRes = [...reservations].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Mes réservations ({reservations.length})
          </Typography>
          <Tooltip title="Actualiser">
            <IconButton size="small" onClick={() => refetchMyRes()} aria-label="Actualiser">
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {sortedRes.map((r) => {
            const canCancel =
              r.status === ReservationStatus.Pending ||
              r.status === ReservationStatus.Confirmed;
            const slotDate = parseISO(r.slot_date);
            return (
              <Paper
                key={r.id}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, borderColor: 'divider' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <StatusChip status={r.status} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                      <CalendarToday sx={{ fontSize: 13, color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>
                        {format(slotDate, 'EEEE d MMMM yyyy', { locale: fr })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <AccessTime sx={{ fontSize: 13, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {formatSlot(r.slot_starts_at)} – {formatSlot(r.slot_ends_at)}
                      </Typography>
                    </Box>
                    {r.client_message && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mt: 0.5 }}>
                        <Forum sx={{ fontSize: 13, color: 'text.secondary', mt: 0.2 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          {r.client_message}
                        </Typography>
                      </Box>
                    )}
                    {r.landlord_notes && (
                      <Alert severity="info" icon={false} sx={{ mt: 1, py: 0.5, px: 1, fontSize: '0.75rem', borderRadius: 1.5 }}>
                        <strong>Note du propriétaire :</strong> {r.landlord_notes}
                      </Alert>
                    )}
                    {r.cancellation_reason && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                        Motif : {r.cancellation_reason}
                      </Typography>
                    )}
                    {r.cancelled_by === CancelledBy.System && (
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                        Expiré automatiquement
                      </Typography>
                    )}
                  </Box>
                  {canCancel && (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => {
                        setCancelTarget(r);
                        setCancelError('');
                        setCancelReason('');
                      }}
                      sx={{ borderRadius: 1.5, flexShrink: 0, minWidth: 0, fontSize: '0.72rem', px: 1 }}
                    >
                      Annuler
                    </Button>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Box>
    );
  }

  // ─── entry point button ────────────────────────────────────────────────────

  const triggerButton = (
    <Button
      fullWidth
      variant="outlined"
      size="large"
      onClick={() => {
        setTab(0);
        setOpen(true);
      }}
      startIcon={<CalendarMonth />}
      endIcon={<KeyboardArrowRight />}
      sx={{
        py: 1.4,
        mt: 2,
        borderRadius: 2,
        fontWeight: 600,
        fontSize: '0.95rem',
        textTransform: 'none',
        borderColor: 'primary.main',
        color: 'primary.main',
        '&:hover': {
          bgcolor: 'primary.50',
          borderColor: 'primary.dark',
        },
      }}
    >
      Planifier une visite
    </Button>
  );

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <>
      {triggerButton}

      {/* ── Main booking dialog ── */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {/* Header */}
        <Box sx={{ px: 3, pt: 2.5, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700} noWrap sx={{ flex: 1 }}>
            Visite · <span style={{ fontWeight: 400, fontSize: '0.9em', opacity: 0.8 }}>{adTitle}</span>
          </Typography>
          <IconButton size="small" onClick={() => setOpen(false)} aria-label="Fermer">
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v: number) => setTab(v)}
          sx={{
            px: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: 40,
            '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
          }}
        >
          <Tab label="Réserver" />
          <Tab
            label={
              myReservations && myReservations.filter(
                (r) => r.status === ReservationStatus.Pending || r.status === ReservationStatus.Confirmed,
              ).length > 0
                ? `Mes réservations (${myReservations.filter((r) => r.status === ReservationStatus.Pending || r.status === ReservationStatus.Confirmed).length})`
                : 'Mes réservations'
            }
          />
        </Tabs>

        <DialogContent sx={{ pt: 2.5, pb: 3, px: 3 }}>
          {tab === 0 && (
            <>
              {step === 0 && renderDateStep()}
              {step === 1 && renderSlotStep()}
              {step === 2 && renderMessageStep()}
              {step === 3 && renderSuccessStep()}
            </>
          )}
          {tab === 1 && renderMyReservations()}
        </DialogContent>
      </Dialog>

      {/* ── Cancel confirmation dialog ── */}
      <Dialog
        open={!!cancelTarget}
        onClose={() => { if (!isCancelling) { setCancelTarget(null); setCancelError(''); } }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Annuler la visite
          </Typography>
          {cancelTarget && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {format(parseISO(cancelTarget.slot_date), 'EEEE d MMMM yyyy', { locale: fr })}
              {' · '}
              {formatSlot(cancelTarget.slot_starts_at)} – {formatSlot(cancelTarget.slot_ends_at)}
            </Typography>
          )}

          <TextField
            label="Motif d'annulation (optionnel)"
            multiline
            minRows={2}
            fullWidth
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            inputProps={{ maxLength: 250 }}
            size="small"
            sx={{ mb: 2 }}
          />

          {cancelError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {cancelError}
            </Alert>
          )}

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="text"
              onClick={() => { setCancelTarget(null); setCancelError(''); }}
              disabled={isCancelling}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => cancelReservation()}
              disabled={isCancelling}
              startIcon={isCancelling ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              {isCancelling ? 'Annulation…' : 'Confirmer l\'annulation'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
