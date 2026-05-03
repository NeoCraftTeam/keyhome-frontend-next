'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import FadeIn from '@/components/ui/FadeIn';
import { useAuth } from '@/providers/AuthProvider';
import {
  searchAlertsService,
  type SearchAlert,
  type SearchAlertPayload,
} from '@/services/searchAlerts.service';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsActive from '@mui/icons-material/NotificationsActive';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

const ALERTS_QK = ['search-alerts'] as const;
const MAX_ALERTS = 10;

function buildFilterSummary(alert: SearchAlert): string[] {
  const parts: string[] = [];
  if (alert.city_name) parts.push(alert.city_name);
  if (alert.type_name) parts.push(alert.type_name);
  if (alert.price_min || alert.price_max) {
    const min = alert.price_min
      ? `${(alert.price_min / 1000).toFixed(0)}k`
      : '0';
    const max = alert.price_max
      ? `${(alert.price_max / 1000).toFixed(0)}k`
      : '∞';
    parts.push(`${min} – ${max} FCFA`);
  }
  if (alert.bedrooms_min) parts.push(`${alert.bedrooms_min}+ ch.`);
  if (alert.surface_min) parts.push(`${alert.surface_min}+ m²`);
  if (alert.has_parking) parts.push('Parking');
  if (alert.query) parts.push(`"${alert.query}"`);
  return parts;
}

export default function SearchAlertsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SearchAlert | null>(null);
  const [form, setForm] = useState<SearchAlertPayload>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: alertsData, isLoading } = useQuery({
    queryKey: [...ALERTS_QK],
    queryFn: () => searchAlertsService.list(),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });

  const alerts = alertsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: SearchAlertPayload) =>
      searchAlertsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_QK });
      setEditOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SearchAlertPayload;
    }) => searchAlertsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_QK });
      setEditOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => searchAlertsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_QK });
      setDeleteConfirmId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      searchAlertsService.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ALERTS_QK }),
  });

  const resetForm = useCallback(() => {
    setEditingAlert(null);
    setForm({});
  }, []);

  const handleOpenCreate = () => {
    setEditingAlert(null);
    setForm({
      notify_email: true,
      notify_push: true,
    });
    setEditOpen(true);
  };

  const handleOpenEdit = (alert: SearchAlert) => {
    setEditingAlert(alert);
    setForm({
      label: alert.label,
      city_name: alert.city_name,
      type_name: alert.type_name,
      price_min: alert.price_min,
      price_max: alert.price_max,
      bedrooms_min: alert.bedrooms_min,
      surface_min: alert.surface_min,
      query: alert.query,
      notify_email: alert.notify_email ?? true,
      notify_push: alert.notify_push ?? true,
    });
    setEditOpen(true);
  };

  const handleSave = () => {
    if (editingAlert) {
      updateMutation.mutate({ id: editingAlert.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <NotificationsNone
          sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
        />
        <Typography variant="h6" color="text.secondary">
          Connectez-vous pour gérer vos alertes
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn direction="up" delay={0.05}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={() => router.back()}
              size="small"
              aria-label="Retour"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <NotificationsActive sx={{ fontSize: 28, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700}>
              Alertes de recherche
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            disabled={alerts.length >= MAX_ALERTS}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            Nouvelle alerte
          </Button>
        </Box>

        {/* Info banner */}
        <Alert
          severity="info"
          icon={<NotificationsActive />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <Typography variant="body2">
            Recevez une alerte dès qu&apos;une annonce correspond à vos critères
            (notification dans l&apos;app, push si activé, et e-mail si vous le
            choisissez). Au plus{' '}
            <strong>
              {alerts.length}/{MAX_ALERTS}
            </strong>{' '}
            alertes actives.
          </Typography>
        </Alert>

        {/* Loading */}
        <Box aria-live="polite" aria-atomic="true">
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={36} />
            </Box>
          ) : alerts.length === 0 ? (
            <EmptyState
              variant="customer"
              icon={<SearchIcon sx={{ fontSize: 30 }} />}
              title="Aucune alerte configurée"
              description="Créez votre première alerte pour être notifié automatiquement lorsqu'une annonce correspond à vos critères de recherche."
              action={{
                label: 'Créer une alerte',
                onClick: handleOpenCreate,
              }}
            />
          ) : (
            /* Alerts list */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {alerts.map((alert) => {
                const filters = buildFilterSummary(alert);
                const isActive = alert.is_active !== false;
                const emailOn = alert.notify_email ?? true;
                const pushOn = alert.notify_push ?? true;

                return (
                  <Card
                    key={alert.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      opacity: isActive ? 1 : 0.6,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 1,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            noWrap
                          >
                            {alert.label || 'Alerte sans nom'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Créée le{' '}
                            {new Date(alert.created_at).toLocaleDateString(
                              'fr-FR',
                              {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              }
                            )}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Tooltip title={isActive ? 'Désactiver' : 'Activer'}>
                            <Switch
                              checked={isActive}
                              onChange={() =>
                                toggleMutation.mutate({
                                  id: alert.id,
                                  is_active: !isActive,
                                })
                              }
                              size="small"
                              inputProps={{
                                'aria-label': isActive
                                  ? "Désactiver l'alerte"
                                  : "Activer l'alerte",
                              }}
                            />
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Filter chips */}
                      {filters.length > 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.75,
                            mt: 1.5,
                          }}
                        >
                          {filters.map((f, i) => (
                            <Chip
                              key={i}
                              label={f}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>
                      )}

                      {filters.length === 0 && (
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ mt: 1, display: 'block' }}
                        >
                          Aucun filtre configuré — toutes les annonces
                        </Typography>
                      )}

                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          mt: 1.5,
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Canaux :
                        </Typography>
                        <Chip
                          size="small"
                          label="E-mail"
                          color={emailOn ? 'primary' : 'default'}
                          variant={emailOn ? 'filled' : 'outlined'}
                          sx={{
                            fontSize: '0.7rem',
                            opacity: emailOn ? 1 : 0.65,
                          }}
                        />
                        <Chip
                          size="small"
                          label="Push"
                          color={pushOn ? 'primary' : 'default'}
                          variant={pushOn ? 'filled' : 'outlined'}
                          sx={{
                            fontSize: '0.7rem',
                            opacity: pushOn ? 1 : 0.65,
                          }}
                        />
                        {!emailOn && !pushOn && (
                          <Typography variant="caption" color="text.disabled">
                            (notification dans l&apos;app uniquement)
                          </Typography>
                        )}
                      </Box>
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 1.5, pt: 0 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEdit(alert)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteConfirmId(alert.id)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Supprimer
                      </Button>
                    </CardActions>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </FadeIn>

      {/* Create / Edit dialog */}
      <Dialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingAlert ? "Modifier l'alerte" : 'Nouvelle alerte'}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              label="Nom de l'alerte"
              value={form.label ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, label: e.target.value }))
              }
              placeholder="Ex: Appartement Bastos budget 150k"
              size="small"
              fullWidth
            />
            <TextField
              label="Ville"
              value={form.city_name ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, city_name: e.target.value }))
              }
              placeholder="Ex: Douala, Yaoundé"
              size="small"
              fullWidth
            />
            <TextField
              label="Type de bien"
              value={form.type_name ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, type_name: e.target.value }))
              }
              placeholder="Ex: Appartement, Maison"
              size="small"
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Prix min (FCFA)"
                type="number"
                value={form.price_min ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    price_min: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                size="small"
                fullWidth
                inputProps={{ min: 0, inputMode: 'numeric' }}
              />
              <TextField
                label="Prix max (FCFA)"
                type="number"
                value={form.price_max ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    price_max: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                size="small"
                fullWidth
                inputProps={{ min: 0, inputMode: 'numeric' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Chambres min"
                type="number"
                value={form.bedrooms_min ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bedrooms_min: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                size="small"
                fullWidth
                inputProps={{ min: 0, inputMode: 'numeric' }}
              />
              <TextField
                label="Surface min (m²)"
                type="number"
                value={form.surface_min ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    surface_min: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                size="small"
                fullWidth
                inputProps={{ min: 0, inputMode: 'numeric' }}
              />
            </Box>
            <TextField
              label="Mots-clés"
              value={form.query ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, query: e.target.value }))
              }
              placeholder="Ex: piscine, meublé, gardiennage"
              size="small"
              fullWidth
            />
            <FormGroup sx={{ gap: 0.25 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.notify_email ?? true}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        notify_email: e.target.checked,
                      }))
                    }
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    E-mail quand une annonce correspond
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.notify_push ?? true}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        notify_push: e.target.checked,
                      }))
                    }
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    Notification push (navigateur ou appli)
                  </Typography>
                }
              />
            </FormGroup>
            <Typography variant="caption" color="text.secondary">
              Les e-mails sont aussi soumis à vos préférences de messagerie dans
              Paramètres.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setEditOpen(false);
              resetForm();
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            startIcon={
              isSaving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <NotificationsActive />
              )
            }
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {editingAlert ? 'Enregistrer' : "Créer l'alerte"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Supprimer cette alerte ?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Cette action est irréversible. Vous ne recevrez plus de
            notifications pour cette recherche.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              deleteConfirmId && deleteMutation.mutate(deleteConfirmId)
            }
            disabled={deleteMutation.isPending}
            startIcon={
              deleteMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
