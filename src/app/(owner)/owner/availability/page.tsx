'use client';

import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import {
  ownerService,
  type AvailabilitySchedule,
  type AvailabilityPayload,
} from '@/services/owner.service';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { frFR } from '@mui/x-date-pickers/locales';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  EventAvailable as EventIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import FadeIn from '@/components/ui/FadeIn';
import { Ad } from '@/types';

function dateFromYyyyMmDd(value: string): Date {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date();
}

function timeStringToReferenceDate(time: string): Date {
  const [h, m] = time.split(':').map((part) => parseInt(part, 10));
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

const RECURRENCE_LABELS: Record<string, string> = {
  once: 'Une seule fois',
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  biweekly: 'Bihebdomadaire',
  monthly: 'Mensuel',
};

const DAYS_LABELS: Record<string, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mer',
  thursday: 'Jeu',
  friday: 'Ven',
  saturday: 'Sam',
  sunday: 'Dim',
};

const INITIAL_FORM: AvailabilityPayload = {
  name: '',
  starts_on: new Date().toISOString().slice(0, 10),
  ends_on: null,
  periods: [{ starts_at: '09:00', ends_at: '12:00' }],
  recurrence: 'weekly',
  recurrence_days: ['monday', 'wednesday', 'friday'],
  slot_duration: 30,
  buffer_minutes: 10,
};

export default function OwnerAvailabilityPage() {
  const queryClient = useQueryClient();
  const [selectedAdId, setSelectedAdId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<AvailabilitySchedule | null>(null);
  const [form, setForm] = useState<AvailabilityPayload>({ ...INITIAL_FORM });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const { data: adsData, isLoading: adsLoading } = useQuery({
    queryKey: ['owner-ads-all'],
    queryFn: () =>
      ownerService.getMyAds({
        per_page: 100,
        sort: 'created_at',
        order: 'desc',
      }),
  });

  const ads = ((adsData as { data?: Ad[] })?.data ?? []) as Ad[];

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['owner-availability', selectedAdId],
    queryFn: () => ownerService.getAvailabilities(selectedAdId),
    enabled: !!selectedAdId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: AvailabilityPayload) =>
      ownerService.createAvailability(selectedAdId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner-availability', selectedAdId],
      });
      setDialogOpen(false);
      resetForm();
      setSnackbar({
        message: 'Planning créé avec succès',
        severity: 'success',
      });
    },
    onError: () =>
      setSnackbar({ message: 'Erreur lors de la création', severity: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<AvailabilityPayload>;
    }) => ownerService.updateAvailability(selectedAdId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner-availability', selectedAdId],
      });
      setDialogOpen(false);
      setEditingSchedule(null);
      resetForm();
      setSnackbar({ message: 'Planning mis à jour', severity: 'success' });
    },
    onError: () =>
      setSnackbar({
        message: 'Erreur lors de la mise à jour',
        severity: 'error',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (scheduleId: string) =>
      ownerService.deleteAvailability(selectedAdId, scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['owner-availability', selectedAdId],
      });
      setDeleteConfirm(null);
      setSnackbar({ message: 'Planning supprimé', severity: 'success' });
    },
    onError: () =>
      setSnackbar({
        message: 'Erreur lors de la suppression',
        severity: 'error',
      }),
  });

  const resetForm = () => setForm({ ...INITIAL_FORM });

  const openCreate = () => {
    setEditingSchedule(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (s: AvailabilitySchedule) => {
    setEditingSchedule(s);
    setForm({
      name: s.name,
      starts_on: s.starts_on,
      ends_on: s.ends_on,
      periods: s.periods.map((p) => ({
        starts_at: p.starts_at,
        ends_at: p.ends_at,
      })),
      recurrence: (s.frequency as AvailabilityPayload['recurrence']) ?? 'once',
      recurrence_days: (s.frequency_config as { days?: string[] })?.days ?? [],
      slot_duration: s.slot_duration,
      buffer_minutes: s.buffer_minutes,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }
    const payload: AvailabilityPayload = {
      ...form,
      ends_on: form.ends_on || undefined,
    };
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const addPeriod = () => {
    if (form.periods.length < 4) {
      setForm((f) => ({
        ...f,
        periods: [...f.periods, { starts_at: '14:00', ends_at: '17:00' }],
      }));
    }
  };

  const removePeriod = (idx: number) => {
    setForm((f) => ({ ...f, periods: f.periods.filter((_, i) => i !== idx) }));
  };

  const updatePeriod = (
    idx: number,
    field: 'starts_at' | 'ends_at',
    value: string
  ) => {
    setForm((f) => ({
      ...f,
      periods: f.periods.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      ),
    }));
  };

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      recurrence_days: f.recurrence_days?.includes(day)
        ? f.recurrence_days.filter((d) => d !== day)
        : [...(f.recurrence_days ?? []), day],
    }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={fr}
      localeText={
        frFR.components.MuiLocalizationProvider.defaultProps.localeText
      }
    >
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
        <FadeIn>
          <PageBreadcrumbs
            items={[
              { label: 'Tableau de bord', href: '/owner/dashboard' },
              { label: 'Disponibilités' },
            ]}
          />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Disponibilités de visite
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Définissez vos créneaux horaires pour les visites de vos biens. Les
            visiteurs pourront réserver un créneau disponible.
          </Typography>
        </FadeIn>

        {/* ═══ Ad Selector ═══ */}
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel>Sélectionner une annonce</InputLabel>
          <Select
            value={selectedAdId}
            label="Sélectionner une annonce"
            onChange={(e) => setSelectedAdId(e.target.value)}
          >
            {adsLoading ? (
              <MenuItem disabled>Chargement…</MenuItem>
            ) : ads.length === 0 ? (
              <MenuItem disabled>Aucune annonce</MenuItem>
            ) : (
              ads.map((ad) => (
                <MenuItem key={ad.id} value={ad.id}>
                  {ad.title} — {ad.adresse || ad.quarter?.name || ''}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {!selectedAdId ? (
          <Card
            sx={{
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider',
              p: 6,
              textAlign: 'center',
            }}
          >
            <CalendarIcon
              sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
            />
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Sélectionnez une annonce
            </Typography>
            <Typography color="text.secondary">
              Choisissez une annonce ci-dessus pour gérer ses créneaux de
              visite.
            </Typography>
          </Card>
        ) : schedulesLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={100}
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Box>
        ) : (
          <>
            {/* Header + Add button */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Plannings (
                {(schedules as AvailabilitySchedule[] | undefined)?.length ?? 0}
                )
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={openCreate}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Nouveau planning
              </Button>
            </Box>

            {/* Schedule list */}
            {!(schedules as AvailabilitySchedule[] | undefined)?.length ? (
              <Card
                sx={{
                  borderRadius: 3,
                  border: '1px dashed',
                  borderColor: 'divider',
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <EventIcon
                  sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }}
                />
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Aucun planning
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Créez un planning de disponibilité pour que les visiteurs
                  puissent réserver un créneau.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={openCreate}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Créer un planning
                </Button>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(schedules as AvailabilitySchedule[]).map((s) => (
                  <Card
                    key={s.id}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: 3 },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: 1,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <ScheduleIcon
                              sx={{ fontSize: 18, color: 'primary.main' }}
                            />
                            <Typography fontWeight={700}>{s.name}</Typography>
                            {s.is_active && (
                              <Chip
                                label="Actif"
                                size="small"
                                color="success"
                                sx={{ fontSize: '0.65rem', height: 20 }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {s.starts_on} → {s.ends_on || 'Indéfini'}
                            {s.frequency &&
                              ` · ${RECURRENCE_LABELS[s.frequency] || s.frequency}`}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 0.5,
                              mt: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            {s.periods.map((p, idx) => (
                              <Chip
                                key={idx}
                                label={`${p.starts_at} – ${p.ends_at}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                            <Chip
                              label={`${s.slot_duration} min / créneau`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                            {s.buffer_minutes > 0 && (
                              <Chip
                                label={`${s.buffer_minutes} min pause`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            aria-label="Modifier le créneau"
                            onClick={() => openEdit(s)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label="Supprimer le créneau"
                            onClick={() => setDeleteConfirm(s.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </>
        )}

        {/* ═══ Create / Edit Dialog ═══ */}
        <Dialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingSchedule(null);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle fontWeight={700}>
            {editingSchedule
              ? 'Modifier le planning'
              : 'Nouveau planning de disponibilité'}
          </DialogTitle>
          <DialogContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              pt: '8px !important',
            }}
          >
            <TextField
              label="Nom du planning"
              required
              size="small"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Visites du matin"
            />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <DatePicker
                label="Date de début"
                value={dateFromYyyyMmDd(form.starts_on)}
                onChange={(d) =>
                  setForm((f) => ({
                    ...f,
                    starts_on:
                      d && isValid(d) ? format(d, 'yyyy-MM-dd') : f.starts_on,
                  }))
                }
                slotProps={{
                  textField: { size: 'small', required: true, fullWidth: true },
                }}
                sx={{ flex: 1, minWidth: 140 }}
              />
              <DatePicker
                label="Date de fin (optionnel)"
                value={form.ends_on ? dateFromYyyyMmDd(form.ends_on) : null}
                onChange={(d) =>
                  setForm((f) => ({
                    ...f,
                    ends_on: d && isValid(d) ? format(d, 'yyyy-MM-dd') : null,
                  }))
                }
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                sx={{ flex: 1, minWidth: 140 }}
              />
            </Box>

            <FormControl size="small">
              <InputLabel>Récurrence</InputLabel>
              <Select
                value={form.recurrence ?? 'once'}
                label="Récurrence"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    recurrence: e.target
                      .value as AvailabilityPayload['recurrence'],
                  }))
                }
              >
                {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(form.recurrence === 'weekly' ||
              form.recurrence === 'biweekly') && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block' }}
                >
                  Jours de la semaine
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {Object.entries(DAYS_LABELS).map(([key, label]) => (
                    <Chip
                      key={key}
                      label={label}
                      size="small"
                      variant={
                        form.recurrence_days?.includes(key)
                          ? 'filled'
                          : 'outlined'
                      }
                      color={
                        form.recurrence_days?.includes(key)
                          ? 'primary'
                          : 'default'
                      }
                      onClick={() => toggleDay(key)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Time periods */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Plages horaires ({form.periods.length}/4)
                </Typography>
                {form.periods.length < 4 && (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addPeriod}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Ajouter
                  </Button>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {form.periods.map((p, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <TimePicker
                      label="Début"
                      ampm={false}
                      value={timeStringToReferenceDate(p.starts_at)}
                      onChange={(d) =>
                        updatePeriod(
                          idx,
                          'starts_at',
                          d && isValid(d) ? format(d, 'HH:mm') : p.starts_at
                        )
                      }
                      slotProps={{
                        textField: { size: 'small', fullWidth: true },
                      }}
                      sx={{ flex: 1, minWidth: 120 }}
                    />
                    <TimePicker
                      label="Fin"
                      ampm={false}
                      value={timeStringToReferenceDate(p.ends_at)}
                      onChange={(d) =>
                        updatePeriod(
                          idx,
                          'ends_at',
                          d && isValid(d) ? format(d, 'HH:mm') : p.ends_at
                        )
                      }
                      slotProps={{
                        textField: { size: 'small', fullWidth: true },
                      }}
                      sx={{ flex: 1, minWidth: 120 }}
                    />
                    {form.periods.length > 1 && (
                      <IconButton
                        size="small"
                        aria-label="Supprimer la période"
                        onClick={() => removePeriod(idx)}
                        color="error"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Durée créneau (min)"
                type="number"
                size="small"
                value={form.slot_duration}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    slot_duration: Number(e.target.value),
                  }))
                }
                slotProps={{ htmlInput: { min: 15, max: 240 } }}
                fullWidth
              />
              <TextField
                label="Pause entre créneaux (min)"
                type="number"
                size="small"
                value={form.buffer_minutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    buffer_minutes: Number(e.target.value),
                  }))
                }
                slotProps={{ htmlInput: { min: 0, max: 60 } }}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setDialogOpen(false);
                setEditingSchedule(null);
              }}
              variant="outlined"
              disabled={isPending}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={
                isPending ||
                !form.name ||
                !form.starts_on ||
                form.periods.length === 0
              }
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              {isPending
                ? 'Enregistrement…'
                : editingSchedule
                  ? 'Mettre à jour'
                  : 'Créer le planning'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ═══ Delete Confirmation ═══ */}
        <Dialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle fontWeight={700}>Supprimer ce planning ?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Les réservations en attente associées à ce planning seront
              automatiquement annulées.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setDeleteConfirm(null)}
              variant="outlined"
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Annuler
            </Button>
            <Button
              onClick={() =>
                deleteConfirm && deleteMutation.mutate(deleteConfirm)
              }
              color="error"
              variant="contained"
              disabled={deleteMutation.isPending}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!snackbar}
          autoHideDuration={4000}
          onClose={() => setSnackbar(null)}
        >
          {snackbar ? (
            <Alert
              onClose={() => setSnackbar(null)}
              severity={snackbar.severity}
              sx={{ borderRadius: 2 }}
            >
              {snackbar.message}
            </Alert>
          ) : undefined}
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
}
