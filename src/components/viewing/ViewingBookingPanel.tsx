'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import CalendarExportMenu from '@/components/ui/display/CalendarExportMenu';
import {
  getLaravelNestedApiError,
  getLaravelNestedApiErrorCode,
} from '@/lib/api-errors';
import { getEcho, isReverbRealtimeConfigured } from '@/lib/chat/echo';
import {
  getSafeErrorMessage,
  isUnsafeBackendMessage,
} from '@/lib/error-messages';
import { useAuth } from '@/providers/AuthProvider';
import { viewingsService } from '@/services/viewings.service';
import { gradient, transition } from '@/theme/tokens';
import {
  type BookableSlot,
  CancelledBy,
  type Reservation,
  ReservationStatus,
} from '@/types';
import AccessTime from '@mui/icons-material/AccessTime';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import CalendarToday from '@mui/icons-material/CalendarToday';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Close from '@mui/icons-material/Close';
import EventAvailable from '@mui/icons-material/EventAvailable';
import EventBusy from '@mui/icons-material/EventBusy';
import Forum from '@mui/icons-material/Forum';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import Refresh from '@mui/icons-material/Refresh';
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
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';

// ─── constants ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; color: 'warning' | 'success' | 'error' | 'default' }
> = {
  [ReservationStatus.Pending]: { label: 'En attente', color: 'warning' },
  [ReservationStatus.Confirmed]: { label: 'Confirmée', color: 'success' },
  [ReservationStatus.Cancelled]: { label: 'Annulée', color: 'error' },
  [ReservationStatus.Expired]: { label: 'Expirée', color: 'default' },
  [ReservationStatus.Completed]: { label: 'Terminée', color: 'default' },
  [ReservationStatus.NoShow]: { label: 'Absent', color: 'error' },
};

const MAX_BOOKING_DAYS = 90; // how many days ahead to allow booking
const DEFAULT_VARIANT = 'outlined' as const;

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatSlot(time: string) {
  // "HH:MM" or "HH:MM:SS" → "HH:MM"
  return time.slice(0, 5);
}

// ─── sub-components ──────────────────────────────────────────────────────────

const SLOT_MOTION_SX = {
  transition: transition.polish,
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
} as const;

function StatusChip({ status }: { status: ReservationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'default' as const,
  };
  return (
    <Chip
      label={cfg.label}
      color={cfg.color}
      size="small"
      sx={{
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 28,
        '& .MuiChip-label': { px: 1, lineHeight: 1.2 },
      }}
    />
  );
}

// ─── main props ───────────────────────────────────────────────────────────────

interface Props {
  adId: string;
  adTitle: string;
  /** Human-readable location for calendar events (e.g. "Biyem-Assi, Yaoundé"). */
  adLocation?: string;
  /** Use contained variant for higher visibility (e.g. sidebar CTA) */
  variant?: 'outlined' | 'contained';
  /** Host given name — personalises the booking CTA. */
  hostFirstName?: string;
  /**
   * Controlled mode — when provided, the component's own trigger button is
   * hidden and the dialog open-state is driven externally (e.g. from the
   * mobile `StickyPropertyBar`).
   */
  open?: boolean;
  /** Required when `open` is set. Called when the user closes the dialog. */
  onClose?: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ViewingBookingPanel({
  adId,
  adTitle,
  adLocation,
  variant = DEFAULT_VARIANT,
  hostFirstName,
  open: openProp,
  onClose: onCloseProp,
}: Props) {
  const isControlled = openProp !== undefined;
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // Dialog open — internal state used only in uncontrolled mode.
  const [openInternal, setOpenInternal] = useState(false);
  const open = isControlled ? openProp! : openInternal;
  const setOpen = isControlled
    ? (_v: boolean) => {
        if (!_v) onCloseProp?.();
      }
    : setOpenInternal;

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
  const [bookingErrorHint, setBookingErrorHint] = useState('');
  /** Blocks duplicate POST before React applies isPending (double-click / dual pointer). */
  const bookingSubmitLockRef = useRef(false);
  /** Per-attempt idempotency key — regenerated on each new booking attempt. */
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  // Calendar month currently displayed
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(today));

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
        setBookingErrorHint('');
        bookingSubmitLockRef.current = false;
        setCalendarMonth(startOfMonth(today));
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Month-range slots (for calendar dot hints) ────────────────────────────
  const monthFrom = format(startOfMonth(calendarMonth), 'yyyy-MM-dd');
  const monthTo = format(endOfMonth(calendarMonth), 'yyyy-MM-dd');
  const { data: monthSlots } = useQuery({
    queryKey: ['slots-range', adId, monthFrom, monthTo],
    queryFn: () => viewingsService.getSlotsByRange(adId, monthFrom, monthTo),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  /** Returns true if the given date has at least one available slot this month. */
  const dateHasAvailableSlot = (d: Date): boolean => {
    const key = format(d, 'yyyy-MM-dd');
    return (monthSlots?.[key] ?? []).some((s) => s.is_available);
  };

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
    isError: myResError,
    isFetching: myResFetching,
    refetch: refetchMyRes,
  } = useQuery({
    queryKey: ['my-reservations', adId],
    queryFn: () => viewingsService.myReservations(adId),
    enabled: isAuthenticated && open,
    staleTime: 30_000,
  });

  const activeMyReservationsCount =
    myReservations?.filter(
      (r) =>
        r.status === ReservationStatus.Pending ||
        r.status === ReservationStatus.Confirmed
    ).length ?? 0;

  // ── Create reservation mutation ────────────────────────────────────────────
  const { mutate: createReservation, isPending: isCreating } = useMutation({
    mutationFn: () =>
      viewingsService.reserve(
        adId,
        {
          slot_date: dateStr,
          slot_starts_at: selectedSlot!.starts_at,
          slot_ends_at: selectedSlot!.ends_at,
          client_message: message.trim() || undefined,
        },
        idempotencyKeyRef.current
      ),
    onSuccess: () => {
      setStep(3);
      idempotencyKeyRef.current = crypto.randomUUID();
      queryClient.invalidateQueries({ queryKey: ['my-reservations', adId] });
      queryClient.invalidateQueries({ queryKey: ['slots', adId, dateStr] });
    },
    onError: (err) => {
      const nested = getLaravelNestedApiError(err);
      if (nested) {
        const safeMsg = isUnsafeBackendMessage(nested.message)
          ? 'Ce créneau n’est pas disponible pour la date demandée.'
          : nested.message;
        const safeHint =
          nested.hint &&
          nested.hint !== nested.message &&
          !isUnsafeBackendMessage(nested.hint)
            ? nested.hint
            : '';
        setBookingError(safeMsg);
        setBookingErrorHint(safeHint);
      } else {
        setBookingError(
          getSafeErrorMessage(err, 'Impossible de créer la réservation.')
        );
        setBookingErrorHint('');
      }

      if (getLaravelNestedApiErrorCode(err) === 'SLOT_NOT_AVAILABLE') {
        void queryClient.invalidateQueries({ queryKey: ['slots', adId] });
        void queryClient.invalidateQueries({ queryKey: ['slots-range', adId] });
        setSelectedSlot(null);
        setStep(1);
      }
    },
    onSettled: () => {
      bookingSubmitLockRef.current = false;
    },
  });

  // ── Cancel mutation ────────────────────────────────────────────────────────
  const { mutate: cancelReservation, isPending: isCancelling } = useMutation({
    mutationFn: () =>
      viewingsService.cancel(
        adId,
        cancelTarget!.id,
        cancelReason.trim() || undefined
      ),
    onSuccess: () => {
      setCancelTarget(null);
      setCancelReason('');
      setCancelError('');
      queryClient.invalidateQueries({ queryKey: ['my-reservations', adId] });
      queryClient.invalidateQueries({ queryKey: ['slots', adId, dateStr] });
    },
    onError: (err) => {
      setCancelError(
        getSafeErrorMessage(err, "Impossible d'annuler cette réservation.")
      );
    },
  });

  // ── Real-time slot availability listener ────────────────────────────────────
  // Listens on the public ad.{adId}.slots channel so the calendar refreshes
  // automatically when another user books or cancels a slot on this ad.
  useEffect(() => {
    if (!open || !isReverbRealtimeConfigured()) return;

    let echo: ReturnType<typeof getEcho> | null = null;
    try {
      echo = getEcho();
    } catch {
      return;
    }

    const channel = echo.channel(`ad.${adId}.slots`);

    channel.listen('.slot.availability_changed', () => {
      void queryClient.invalidateQueries({ queryKey: ['slots', adId] });
      void queryClient.invalidateQueries({ queryKey: ['slots-range', adId] });
    });

    return () => {
      try {
        echo?.leave(`ad.${adId}.slots`);
      } catch {
        // ignore cleanup errors
      }
    };
  }, [open, adId, queryClient]);

  // ─── calendar month navigation ─────────────────────────────────────────────
  const canGoPrevMonth = isAfter(
    startOfMonth(calendarMonth),
    startOfMonth(today)
  );
  const canGoNextMonth = isBefore(
    startOfMonth(addMonths(calendarMonth, 1)),
    addDays(maxDate, 1)
  );

  function handlePrevMonth() {
    const prev = addMonths(calendarMonth, -1);
    setCalendarMonth(
      isBefore(prev, startOfMonth(today)) ? startOfMonth(today) : prev
    );
  }
  function handleNextMonth() {
    const next = addMonths(calendarMonth, 1);
    if (canGoNextMonth) {
      setCalendarMonth(next);
    }
  }

  function handleDateSelect(d: Date) {
    setSelectedDate(d);
    setSelectedSlot(null);
    setBookingError('');
    setBookingErrorHint('');
    setStep(1);
  }

  function handleSlotSelect(s: BookableSlot) {
    if (!s.is_available) {
      return;
    }
    setSelectedSlot(s);
    setStep(2);
  }

  // ─── render helpers ────────────────────────────────────────────────────────

  function renderDateStep() {
    const firstDay = startOfMonth(calendarMonth);
    const lastDay = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });

    // Monday-first padding: Sunday(0)→6, Monday(1)→0, …
    const startPad = (getDay(firstDay) + 6) % 7;
    const cells: (Date | null)[] = [
      ...Array<null>(startPad).fill(null),
      ...days,
    ];
    const endPad = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < endPad; i++) {
      cells.push(null);
    }

    const DOW_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return (
      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          Choisissez une date
        </Typography>

        {/* Month navigator */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <IconButton
            onClick={handlePrevMonth}
            disabled={!canGoPrevMonth}
            aria-label="Mois précédent"
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{ flex: 1, textAlign: 'center', textTransform: 'capitalize' }}
          >
            {format(calendarMonth, 'MMMM yyyy', { locale: fr })}
          </Typography>
          <IconButton
            onClick={handleNextMonth}
            disabled={!canGoNextMonth}
            aria-label="Mois suivant"
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>

        {/* Day-of-week header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            mb: 0.5,
          }}
        >
          {DOW_LABELS.map((d) => (
            <Typography
              key={d}
              variant="caption"
              sx={{
                textAlign: 'center',
                fontWeight: 600,
                color: 'text.disabled',
                fontSize: '0.62rem',
                textTransform: 'uppercase',
              }}
            >
              {d}
            </Typography>
          ))}
        </Box>

        {/* Calendar grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.25,
          }}
        >
          {cells.map((d, idx) => {
            if (!d) {
              return <Box key={`pad-${idx}`} />;
            }
            const isPast = isBefore(startOfDay(d), today);
            const isBeyondMax = isAfter(d, maxDate);
            const isDisabled = isPast || isBeyondMax;
            const isSel = selectedDate ? isSameDay(d, selectedDate) : false;
            const isNow = isToday(d);
            return (
              <Box
                key={d.toISOString()}
                onClick={() => !isDisabled && handleDateSelect(d)}
                role={isDisabled ? undefined : 'button'}
                tabIndex={isDisabled ? -1 : 0}
                aria-label={format(d, 'EEEE d MMMM', { locale: fr })}
                aria-pressed={isSel}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                    e.preventDefault();
                    handleDateSelect(d);
                  }
                  if (
                    [
                      'ArrowRight',
                      'ArrowLeft',
                      'ArrowDown',
                      'ArrowUp',
                    ].includes(e.key)
                  ) {
                    e.preventDefault();
                    const offset =
                      e.key === 'ArrowRight'
                        ? 1
                        : e.key === 'ArrowLeft'
                          ? -1
                          : e.key === 'ArrowDown'
                            ? 7
                            : -7;
                    const target = addDays(d, offset);
                    const btn = (
                      e.currentTarget.parentElement as HTMLElement
                    )?.querySelector<HTMLElement>(
                      `[aria-label="${format(target, 'EEEE d MMMM', { locale: fr })}"]`
                    );
                    btn?.focus();
                  }
                }}
                sx={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled ? 0.28 : 1,
                  bgcolor: isSel ? 'primary.main' : 'transparent',
                  border: '2px solid',
                  borderColor: isSel
                    ? 'primary.main'
                    : isNow
                      ? 'primary.main'
                      : 'transparent',
                  transition:
                    'background-color 0.22s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                  },
                  '&:hover': !isDisabled
                    ? { bgcolor: isSel ? 'primary.dark' : 'action.hover' }
                    : {},
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isSel || isNow ? 700 : 400,
                    color: isSel
                      ? 'primary.contrastText'
                      : isNow
                        ? 'primary.main'
                        : 'text.primary',
                    fontSize: '0.82rem',
                    lineHeight: 1,
                  }}
                >
                  {format(d, 'd')}
                </Typography>
                {/* Green dot when the date has at least one available slot */}
                {!isDisabled && dateHasAvailableSlot(d) && (
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: isSel ? 'primary.contrastText' : 'success.main',
                      mt: '2px',
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}
        >
          • = créneaux disponibles — sélectionnez une date pour réserver
        </Typography>
      </Box>
    );
  }

  function renderSlotStep() {
    const available = (slots ?? []).filter((s) => s.is_available);
    const booked = (slots ?? []).filter((s) => !s.is_available);

    return (
      <Box>
        {/* Back + date label */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton
            onClick={() => {
              setStep(0);
              setSelectedSlot(null);
            }}
            aria-label="Retour au choix de la date"
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <CalendarToday sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight={600}>
            {selectedDate
              ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
              : ''}
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
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={() => refetchSlots()}
              sx={{
                mt: 1,
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 44,
              }}
            >
              Réessayer
            </Button>
          </Box>
        )}

        {!slotsLoading && !slotsError && slots && (
          <>
            {available.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <EventBusy
                  sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Aucun créneau disponible pour cette date.
                </Typography>
                <Button size="small" sx={{ mt: 1 }} onClick={() => setStep(0)}>
                  Choisir une autre date
                </Button>
              </Box>
            ) : (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block', fontWeight: 500 }}
                >
                  Créneaux disponibles ({available.length})
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(2, 1fr)',
                      sm: 'repeat(3, 1fr)',
                    },
                    gap: 0.75,
                    mb: booked.length > 0 ? 2 : 0,
                  }}
                >
                  {available.map((s) => {
                    const isSel = selectedSlot?.starts_at === s.starts_at;
                    return (
                      <Box
                        key={s.starts_at}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSlotSelect(s)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleSlotSelect(s);
                          }
                        }}
                        aria-pressed={isSel}
                        sx={{
                          py: 1.25,
                          px: 0.75,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: isSel ? 'primary.main' : 'divider',
                          bgcolor: isSel ? 'primary.main' : 'background.paper',
                          cursor: 'pointer',
                          textAlign: 'center',
                          ...SLOT_MOTION_SX,
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'primary.50',
                          },
                          '&:focus-visible': {
                            outline: '2px solid',
                            outlineColor: 'primary.main',
                            outlineOffset: 2,
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: isSel
                              ? 'primary.contrastText'
                              : 'text.primary',
                            display: 'block',
                            lineHeight: 1.4,
                          }}
                        >
                          {formatSlot(s.starts_at)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: isSel
                              ? 'rgba(255,255,255,0.75)'
                              : 'text.secondary',
                            fontSize: '0.62rem',
                          }}
                        >
                          — {formatSlot(s.ends_at)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {booked.length > 0 && (
                  <>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ mb: 0.5, display: 'block', fontWeight: 500 }}
                    >
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
          <IconButton
            onClick={() => setStep(1)}
            aria-label="Retour au choix du créneau"
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Typography variant="subtitle2" fontWeight={600}>
            Votre visite
          </Typography>
        </Box>

        {/* Summary card */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            mb: 2,
            bgcolor: (t) =>
              t.palette.mode === 'dark'
                ? 'rgba(246,71,95,0.06)'
                : 'rgba(246,71,95,0.04)',
            borderColor: 'primary.light',
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth sx={{ fontSize: 15, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={600}>
                  {selectedDate
                    ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
                    : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime sx={{ fontSize: 15, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={600}>
                  {selectedSlot
                    ? `${formatSlot(selectedSlot.starts_at)} – ${formatSlot(selectedSlot.ends_at)}`
                    : ''}
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
          <AppAlert
            severity="error"
            message={bookingError}
            hint={bookingErrorHint || undefined}
            sx={{ mb: 2 }}
          />
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => {
            if (bookingSubmitLockRef.current || isCreating) {
              return;
            }
            bookingSubmitLockRef.current = true;
            createReservation();
          }}
          disabled={isCreating}
          startIcon={
            isCreating ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <EventAvailable />
            )
          }
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            background: gradient.primary,
            '&:hover': { background: gradient.primaryHover },
          }}
        >
          {isCreating ? 'Réservation en cours…' : 'Confirmer la visite'}
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}
        >
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
          {selectedDate
            ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
            : ''}
          {selectedSlot
            ? ` · ${formatSlot(selectedSlot.starts_at)} – ${formatSlot(selectedSlot.ends_at)}`
            : ''}
        </Typography>

        <Alert
          icon={false}
          severity="success"
          sx={{ mt: 2, mb: 2, borderRadius: 2, textAlign: 'left' }}
        >
          <Typography variant="body2">
            Votre créneau est retenu pendant 24h. Le propriétaire vous
            contactera pour confirmer la visite. Assurez-vous d&apos;être
            joignable sur votre numéro enregistré.
          </Typography>
        </Alert>

        {selectedDate && selectedSlot && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1, fontWeight: 500 }}
            >
              Ajouter à votre calendrier
            </Typography>
            <CalendarExportMenu
              title={`Visite — ${adTitle}`}
              date={format(selectedDate, 'yyyy-MM-dd')}
              startTime={selectedSlot.starts_at.slice(0, 5)}
              endTime={selectedSlot.ends_at.slice(0, 5)}
              location={adLocation ?? ''}
              description="Visite de bien sur KeyHome. En attente de confirmation du propriétaire."
              inline
              sx={{ justifyContent: 'center' }}
            />
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
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
              setBookingErrorHint('');
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
            sx={{
              background: gradient.primary,
              '&:hover': { background: gradient.primaryHover },
            }}
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
        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          role="status"
          aria-busy="true"
          aria-live="polite"
        >
          {[1, 2, 3].map((i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}
            >
              <Skeleton
                variant="rounded"
                width={100}
                height={28}
                sx={{ mb: 1.5 }}
              />
              <Skeleton variant="text" width="85%" height={22} />
              <Skeleton variant="text" width="55%" height={20} />
            </Paper>
          ))}
        </Box>
      );
    }

    if (myResError) {
      return (
        <Box sx={{ py: 2 }}>
          <Alert
            severity="error"
            sx={{ borderRadius: 2, mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void refetchMyRes()}
                disabled={myResFetching}
                sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600 }}
              >
                Réessayer
              </Button>
            }
          >
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Impossible de charger vos réservations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vérifiez votre connexion puis réessayez.
            </Typography>
          </Alert>
        </Box>
      );
    }

    const reservations = myReservations ?? [];

    if (reservations.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <EventAvailable
            sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 320, mx: 'auto' }}
          >
            Les visites que vous réservez sur cette annonce apparaissent ici (en
            attente, confirmées, annulées).
          </Typography>
          <Button
            variant="outlined"
            sx={{
              mt: 2,
              textTransform: 'none',
              minHeight: 44,
              borderRadius: 2,
            }}
            onClick={() => setTab(0)}
          >
            Réserver une visite
          </Button>
        </Box>
      );
    }

    const sortedRes = [...reservations].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Mes réservations
            <Box
              component="span"
              sx={{
                ml: 0.75,
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: '0.9rem',
              }}
            >
              ({reservations.length})
            </Box>
          </Typography>
          <Tooltip title="Actualiser la liste">
            <IconButton
              onClick={() => refetchMyRes()}
              aria-label="Actualiser la liste des réservations"
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          component="ul"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            listStyle: 'none',
            m: 0,
            p: 0,
          }}
        >
          {sortedRes.map((r) => {
            const canCancel =
              r.status === ReservationStatus.Pending ||
              r.status === ReservationStatus.Confirmed;
            const slotDate = parseISO(r.slot_date);
            return (
              <Paper
                component="li"
                key={r.id}
                variant="outlined"
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 2,
                  borderColor: 'divider',
                  ...SLOT_MOTION_SX,
                  '&:hover': {
                    boxShadow: (t) => t.shadows[2],
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <StatusChip status={r.status} />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        mb: 0.25,
                      }}
                    >
                      <CalendarToday
                        sx={{ fontSize: 13, color: 'text.secondary' }}
                      />
                      <Typography
                        component="h3"
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{ fontSize: '0.9375rem', lineHeight: 1.35 }}
                      >
                        {format(slotDate, 'EEEE d MMMM yyyy', { locale: fr })}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                    >
                      <AccessTime
                        sx={{ fontSize: 13, color: 'text.secondary' }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.875rem', lineHeight: 1.45 }}
                      >
                        {formatSlot(r.slot_starts_at)} –{' '}
                        {formatSlot(r.slot_ends_at)}
                      </Typography>
                    </Box>
                    {r.client_message && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 0.75,
                          mt: 0.5,
                        }}
                      >
                        <Forum
                          sx={{
                            fontSize: 13,
                            color: 'text.secondary',
                            mt: 0.2,
                          }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontStyle: 'italic', lineHeight: 1.45 }}
                        >
                          {r.client_message}
                        </Typography>
                      </Box>
                    )}
                    {r.landlord_notes && (
                      <Alert
                        severity="info"
                        icon={false}
                        sx={{
                          mt: 1,
                          py: 0.5,
                          px: 1,
                          fontSize: '0.75rem',
                          borderRadius: 1.5,
                        }}
                      >
                        <strong>Note du propriétaire :</strong>{' '}
                        {r.landlord_notes}
                      </Alert>
                    )}
                    {r.cancellation_reason && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        Motif : {r.cancellation_reason}
                      </Typography>
                    )}
                    {r.cancelled_by === CancelledBy.System && (
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ display: 'block', mt: 0.25 }}
                      >
                        Expiré automatiquement
                      </Typography>
                    )}
                  </Box>
                  {canCancel && (
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={() => {
                        setCancelTarget(r);
                        setCancelError('');
                        setCancelReason('');
                      }}
                      sx={{
                        flexShrink: 0,
                        minWidth: 44,
                        minHeight: 44,
                        px: 1.5,
                        alignSelf: { xs: 'stretch', sm: 'flex-start' },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        '&:focus-visible': { outlineOffset: 2 },
                      }}
                    >
                      Annuler
                    </Button>
                  )}
                </Box>
                {r.status === ReservationStatus.Confirmed && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1, fontWeight: 500 }}
                    >
                      Ajouter à votre calendrier
                    </Typography>
                    <CalendarExportMenu
                      title={`Visite — ${adTitle}`}
                      date={r.slot_date}
                      startTime={r.slot_starts_at.slice(0, 5)}
                      endTime={r.slot_ends_at.slice(0, 5)}
                      location={adLocation ?? ''}
                      description={`Visite confirmée sur KeyHome.\nRéf : ${r.id}`}
                      inline
                      sx={{ justifyContent: 'center' }}
                    />
                  </Box>
                )}
              </Paper>
            );
          })}
        </Box>
      </Box>
    );
  }

  // ─── entry point button ────────────────────────────────────────────────────

  const triggerButton = (
    <Box sx={{ mt: 2 }}>
      <Button
        fullWidth
        variant={variant}
        size="large"
        onClick={() => {
          setTab(0);
          setOpen(true);
        }}
        startIcon={<CalendarMonth />}
        endIcon={<KeyboardArrowRight />}
        sx={{
          py: 1.4,
          borderRadius: 2,
          fontWeight: 700,
          fontSize: '0.95rem',
          textTransform: 'none',
          ...(variant === 'contained'
            ? {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
              }
            : {
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.50',
                  borderColor: 'primary.dark',
                },
              }),
        }}
      >
        {hostFirstName
          ? `Proposer une visite avec ${hostFirstName}`
          : 'Planifier une visite'}
      </Button>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}
      >
        {hostFirstName
          ? `${hostFirstName} recevra votre demande de créneau.`
          : 'Réservez votre créneau en quelques clics'}
      </Typography>
    </Box>
  );

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger button is hidden in controlled mode (opened by the parent). */}
      {!isControlled && triggerButton}

      {/* ── Main booking dialog ── */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        {/* Header */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pt: 2.5,
            pb: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Visite ·{' '}
            <span style={{ fontWeight: 400, fontSize: '0.9em', opacity: 0.8 }}>
              {adTitle}
            </span>
          </Typography>
          <IconButton
            onClick={() => setOpen(false)}
            aria-label="Fermer la fenêtre de réservation"
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v: number) => setTab(v)}
          aria-label="Visite : réserver ou mes réservations"
          sx={{
            px: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              '&:focus-visible': { outlineOffset: -2 },
            },
          }}
        >
          <Tab
            label="Réserver"
            id="viewing-tab-book"
            aria-controls="viewing-panel-book"
          />
          <Tab
            label={
              activeMyReservationsCount > 0
                ? `Mes réservations (${activeMyReservationsCount})`
                : 'Mes réservations'
            }
            id="viewing-tab-reservations"
            aria-controls="viewing-panel-reservations"
          />
        </Tabs>

        <DialogContent sx={{ pt: 2.5, pb: 3, px: 3 }}>
          <Box
            id="viewing-panel-book"
            role="tabpanel"
            aria-labelledby="viewing-tab-book"
            hidden={tab !== 0}
          >
            {tab === 0 && (
              <>
                {step === 0 && renderDateStep()}
                {step === 1 && renderSlotStep()}
                {step === 2 && renderMessageStep()}
                {step === 3 && renderSuccessStep()}
              </>
            )}
          </Box>
          <Box
            id="viewing-panel-reservations"
            role="tabpanel"
            aria-labelledby="viewing-tab-reservations"
            hidden={tab !== 1}
          >
            {tab === 1 && renderMyReservations()}
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Cancel confirmation dialog ── */}
      <Dialog
        open={!!cancelTarget}
        onClose={() => {
          if (!isCancelling) {
            setCancelTarget(null);
            setCancelError('');
          }
        }}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <Box sx={{ p: 3 }}>
          <Typography component="h2" variant="h6" fontWeight={700} gutterBottom>
            Annuler cette visite&nbsp;?
          </Typography>
          {cancelTarget && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Le créneau sera libéré pour d&apos;autres visiteurs. Le
              propriétaire sera informé de l&apos;annulation.
              <Box component="span" sx={{ display: 'block', mt: 1 }}>
                <strong>
                  {format(
                    parseISO(cancelTarget.slot_date),
                    'EEEE d MMMM yyyy',
                    {
                      locale: fr,
                    }
                  )}
                </strong>
                {' · '}
                <strong>
                  {formatSlot(cancelTarget.slot_starts_at)} –{' '}
                  {formatSlot(cancelTarget.slot_ends_at)}
                </strong>
              </Box>
            </Typography>
          )}

          {cancelTarget && (
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
          )}

          {cancelError && (
            <AppAlert severity="error" message={cancelError} sx={{ mb: 2 }} />
          )}

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="text"
              onClick={() => {
                setCancelTarget(null);
                setCancelError('');
              }}
              disabled={isCancelling}
              sx={{ textTransform: 'none', minHeight: 44 }}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => cancelReservation()}
              disabled={isCancelling}
              startIcon={
                isCancelling ? (
                  <CircularProgress size={14} color="inherit" />
                ) : undefined
              }
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 44,
                borderRadius: 2,
              }}
            >
              {isCancelling ? 'Annulation…' : "Confirmer l'annulation"}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
