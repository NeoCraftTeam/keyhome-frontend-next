'use client';

import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import {
  ownerService,
  type OwnerViewingReservation,
} from '@/services/owner.service';
import {
  CalendarMonth as CalendarIcon,
  CheckCircleOutline as ConfirmIcon,
  CancelOutlined as CancelIcon,
  EditNote as NotesIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ExpandMore as ExpandIcon,
  FilterList as FilterIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Home as AdIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import FadeIn from '@/components/ui/FadeIn';
import { shadow, transition } from '@/theme/tokens';

const MOTION_POLYFILL_SX = {
  transition: transition.polish,
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
} as const;

/** Token-backed primitives — aligns with normalized owner shell */
const FILTER_PANEL_SX = {
  mb: 3,
  p: 2,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
} as const;

const OUTLINED_CONTROL_FOCUS_VISIBLE_SX = {
  '&:focus-visible': {
    outline: 'none',
    boxShadow: shadow.agentFocusRing,
    outlineOffset: 0,
  },
} as const;

const CONTACT_ICON_BTN_FOCUS_VISIBLE_SX = {
  '&:focus-visible': {
    outline: 'none',
    boxShadow: shadow.agentFocusRing,
  },
} as const;

const STATUS_FILTER_CHIP_SX = {
  '&:focus-visible': {
    outline: 'none',
    boxShadow: shadow.agentFocusRing,
  },
} as const;

function viewingReservationCardSx(isPendingReservation: boolean) {
  return {
    borderRadius: 3,
    border: '1px solid',
    borderColor: isPendingReservation ? 'warning.light' : 'divider',
    ...MOTION_POLYFILL_SX,
    '&:hover': {
      boxShadow: shadow.ownerListCardHover,
    },
  };
}

function formatDateTime(dateStr: string, timeStr: string) {
  try {
    const d = new Date(`${dateStr}T${timeStr}`);
    return d.toLocaleString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return `${dateStr} ${timeStr}`;
  }
}

function formatDateShort(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTimeShort(dateStr: string, timeStr: string) {
  try {
    const d = new Date(`${dateStr}T${timeStr}`);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return `${dateStr} ${timeStr}`;
  }
}

const STATUS_CONFIG: Record<
  string,
  { color: 'warning' | 'success' | 'default' | 'error'; label: string }
> = {
  pending: { color: 'warning', label: 'En attente' },
  confirmed: { color: 'success', label: 'Confirmée' },
  cancelled: { color: 'error', label: 'Annulée' },
  expired: { color: 'default', label: 'Expirée' },
};

export default function OwnerViewingsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dialog states
  const [confirmDialog, setConfirmDialog] =
    useState<OwnerViewingReservation | null>(null);
  const [cancelDialog, setCancelDialog] =
    useState<OwnerViewingReservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [notesDialog, setNotesDialog] =
    useState<OwnerViewingReservation | null>(null);
  const [notesValue, setNotesValue] = useState('');

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const queryClient = useQueryClient();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['owner-viewing-reservations', page, statusFilter],
    queryFn: ({ signal }) =>
      ownerService.getViewingReservations(
        {
          page,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        { signal }
      ),
  });

  const reservations = (data?.data ?? []) as OwnerViewingReservation[];
  const meta = data?.meta;

  const invalidateReservations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['owner-viewing-reservations'] });
  }, [queryClient]);

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: (id: string) => ownerService.confirmReservation(id),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Visite confirmée avec succès !',
        severity: 'success',
      });
      setConfirmDialog(null);
      invalidateReservations();
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la confirmation.',
        severity: 'error',
      });
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      ownerService.cancelReservation(id, reason),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Visite annulée.',
        severity: 'success',
      });
      setCancelDialog(null);
      setCancelReason('');
      invalidateReservations();
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: "Erreur lors de l'annulation.",
        severity: 'error',
      });
    },
  });

  // Notes mutation
  const notesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      ownerService.updateReservationNotes(id, notes),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Notes enregistrées.',
        severity: 'success',
      });
      setNotesDialog(null);
      setNotesValue('');
      invalidateReservations();
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la sauvegarde.',
        severity: 'error',
      });
    },
  });

  const isPending = (r: OwnerViewingReservation) => r.status === 'pending';
  const isActive = (r: OwnerViewingReservation) =>
    r.status === 'pending' || r.status === 'confirmed';

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Visites' },
          ]}
        />
      </FadeIn>
      {/* Header */}
      <FadeIn delay={0.05}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'flex-start' }}
          sx={{ mb: 3 }}
        >
          <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
            <Typography
              variant="h4"
              fontWeight={800}
              gutterBottom
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem' },
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }}
            >
              Demandes de visite
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
              Gérez les demandes de visite sur vos annonces. Confirmez, annulez
              et ajoutez des notes.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="owner-viewings-filters"
            sx={{
              flexShrink: 0,
              borderRadius: 2,
              textTransform: 'none',
              alignSelf: { xs: 'stretch', sm: 'flex-start' },
              minHeight: 44,
              ...OUTLINED_CONTROL_FOCUS_VISIBLE_SX,
            }}
          >
            Filtrer
          </Button>
        </Stack>
      </FadeIn>

      {/* Filters */}
      <Collapse in={showFilters}>
        <Box id="owner-viewings-filters" sx={FILTER_PANEL_SX}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              label="Statut"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">Tous les statuts</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="confirmed">Confirmées</MenuItem>
              <MenuItem value="cancelled">Annulées</MenuItem>
              <MenuItem value="expired">Expirées</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Collapse>

      {/* Filtres rapides par statut (les totaux viennent de l’API paginée — pas de compteur trompeur) */}
      {!isLoading && !isError && reservations.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mb: 3,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ width: '100%', mb: 0.5, fontWeight: 600 }}
          >
            Filtrer par statut
          </Typography>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <Chip
              key={key}
              label={cfg.label}
              color={cfg.color}
              variant={statusFilter === key ? 'filled' : 'outlined'}
              onClick={() => {
                setStatusFilter(statusFilter === key ? '' : key);
                setPage(1);
              }}
              sx={{
                fontWeight: 600,
                cursor: 'pointer',
                ...STATUS_FILTER_CHIP_SX,
              }}
            />
          ))}
        </Box>
      )}

      {/* Loading */}
      {isLoading ? (
        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          role="status"
          aria-busy="true"
          aria-live="polite"
        >
          {[1, 2, 3, 4].map((i) => (
            <Box
              key={i}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                p: { xs: 2, sm: 2.5 },
              }}
            >
              <Skeleton variant="text" width="55%" height={28} sx={{ mb: 1 }} />
              <Skeleton
                variant="text"
                width="40%"
                height={20}
                sx={{ mb: 0.5 }}
              />
              <Skeleton variant="text" width="70%" height={20} />
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Skeleton
                  variant="rounded"
                  width={100}
                  height={40}
                  sx={{ borderRadius: 1.5 }}
                />
                <Skeleton
                  variant="rounded"
                  width={100}
                  height={40}
                  sx={{ borderRadius: 1.5 }}
                />
              </Stack>
            </Box>
          ))}
        </Box>
      ) : isError ? (
        <Alert
          severity="error"
          sx={{ borderRadius: 2, py: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void refetch()}
              disabled={isFetching}
              sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600 }}
            >
              Réessayer
            </Button>
          }
        >
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Impossible de charger les demandes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vérifiez votre connexion, puis réessayez. Si le problème persiste,
            contactez le support.
          </Typography>
        </Alert>
      ) : reservations.length === 0 ? (
        /* Empty state */
        <Card
          sx={{
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            p: 6,
            textAlign: 'center',
          }}
        >
          <CalendarIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {statusFilter
              ? 'Aucune demande pour ce filtre'
              : 'Aucune demande de visite'}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 400, mx: 'auto', mb: statusFilter ? 2 : 0 }}
          >
            {statusFilter
              ? 'Aucune demande ne correspond au statut sélectionné. Essayez « Tous les statuts » ou un autre filtre.'
              : 'Les demandes de visite pour vos annonces apparaîtront ici. Configurez les créneaux sur chaque annonce pour en recevoir.'}
          </Typography>
          {statusFilter !== '' ? (
            <Button
              variant="outlined"
              onClick={() => {
                setStatusFilter('');
                setPage(1);
              }}
              sx={{
                mt: 1,
                textTransform: 'none',
                borderRadius: 2,
                minHeight: 44,
              }}
            >
              Effacer le filtre
            </Button>
          ) : null}
        </Card>
      ) : (
        /* Reservation list */
        <>
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
            {reservations.map((r) => {
              const statusCfg =
                STATUS_CONFIG[r.status] || STATUS_CONFIG.expired;
              const isExpanded = expandedId === r.id;

              return (
                <Card
                  component="li"
                  key={r.id}
                  sx={viewingReservationCardSx(isPending(r))}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    {/* Main row */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                        {/* Ad title */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                            mb: 0.5,
                            flexWrap: 'wrap',
                          }}
                        >
                          <AdIcon
                            sx={{
                              fontSize: 18,
                              color: 'primary.main',
                              mt: 0.25,
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            component="h2"
                            fontWeight={700}
                            variant="subtitle1"
                            sx={{
                              wordBreak: 'break-word',
                              minWidth: 0,
                              lineHeight: 1.35,
                            }}
                          >
                            {r.ad?.title || 'Annonce'}
                          </Typography>
                        </Box>

                        {/* Client info */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 0.5,
                            flexWrap: 'wrap',
                            minWidth: 0,
                            width: '100%',
                          }}
                        >
                          <PersonIcon
                            sx={{ fontSize: 16, color: 'text.secondary' }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              lineHeight: 1.45,
                              minWidth: 0,
                              flex: '1 1 auto',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={
                              r.client
                                ? `${r.client.firstname} ${r.client.lastname}`
                                : undefined
                            }
                          >
                            {r.client
                              ? `${r.client.firstname} ${r.client.lastname}`
                              : 'Client inconnu'}
                          </Typography>
                          {r.client?.phone_number && (
                            <Tooltip title={r.client.phone_number} arrow>
                              <IconButton
                                aria-label={`Appeler ${r.client.firstname || 'le client'}`}
                                href={`tel:${r.client.phone_number}`}
                                size="small"
                                sx={{
                                  minWidth: 44,
                                  minHeight: 44,
                                  color: 'text.secondary',
                                  ...CONTACT_ICON_BTN_FOCUS_VISIBLE_SX,
                                }}
                              >
                                <PhoneIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {r.client?.email && (
                            <Tooltip title={r.client.email} arrow>
                              <IconButton
                                aria-label="Envoyer un courriel au client"
                                href={`mailto:${r.client.email}`}
                                size="small"
                                sx={{
                                  minWidth: 44,
                                  minHeight: 44,
                                  color: 'text.secondary',
                                  ...CONTACT_ICON_BTN_FOCUS_VISIBLE_SX,
                                }}
                              >
                                <EmailIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>

                        {/* Date/time */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                          }}
                        >
                          <TimeIcon
                            sx={{
                              fontSize: 16,
                              color: 'text.secondary',
                              mt: 0.25,
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ wordBreak: 'break-word' }}
                          >
                            <Box
                              component="span"
                              sx={{ display: { xs: 'none', sm: 'inline' } }}
                            >
                              {formatDateTime(r.slot_date, r.slot_starts_at)}
                            </Box>
                            <Box
                              component="span"
                              sx={{ display: { xs: 'inline', sm: 'none' } }}
                            >
                              {formatDateTimeShort(
                                r.slot_date,
                                r.slot_starts_at
                              )}
                            </Box>
                          </Typography>
                        </Box>

                        {/* Client message */}
                        {r.client_message && (
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 1,
                              fontStyle: 'italic',
                              color: 'text.secondary',
                              pl: 1,
                              borderLeft: '2px solid',
                              borderColor: 'divider',
                            }}
                          >
                            &laquo; {r.client_message} &raquo;
                          </Typography>
                        )}
                      </Box>

                      {/* Right side: status + actions */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                          gap: 1,
                          width: { xs: '100%', sm: 'auto' },
                        }}
                      >
                        <Chip
                          label={r.status_label || statusCfg.label}
                          size="small"
                          color={statusCfg.color}
                          sx={{ fontWeight: 600 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{
                            display: 'block',
                            textAlign: { xs: 'left', sm: 'right' },
                          }}
                        >
                          Demandé le {formatDateShort(r.created_at)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action buttons */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: 'repeat(2, minmax(0, 1fr))',
                          sm: 'repeat(auto-fit, minmax(120px, auto))',
                        },
                        gap: 1,
                        mt: 2,
                        pt: 1.5,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        alignItems: 'stretch',
                      }}
                    >
                      {isPending(r) && (
                        <Button
                          size="medium"
                          variant="contained"
                          color="success"
                          startIcon={<ConfirmIcon />}
                          onClick={() => setConfirmDialog(r)}
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            minHeight: 44,
                            ...OUTLINED_CONTROL_FOCUS_VISIBLE_SX,
                          }}
                        >
                          Confirmer
                        </Button>
                      )}
                      {isActive(r) && (
                        <Button
                          size="medium"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => setCancelDialog(r)}
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            minHeight: 44,
                            ...OUTLINED_CONTROL_FOCUS_VISIBLE_SX,
                          }}
                        >
                          Annuler
                        </Button>
                      )}
                      <Button
                        size="medium"
                        variant="outlined"
                        color="inherit"
                        startIcon={<NotesIcon />}
                        onClick={() => {
                          setNotesDialog(r);
                          setNotesValue(r.landlord_notes || '');
                        }}
                        sx={{
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          minHeight: 44,
                          ...OUTLINED_CONTROL_FOCUS_VISIBLE_SX,
                        }}
                      >
                        {r.landlord_notes ? 'Modifier notes' : 'Ajouter notes'}
                      </Button>
                      <Button
                        size="medium"
                        variant="text"
                        color="inherit"
                        aria-expanded={isExpanded}
                        aria-controls={`owner-viewing-details-${r.id}`}
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        endIcon={
                          <ExpandIcon
                            sx={{
                              transform: isExpanded ? 'rotate(180deg)' : 'none',
                              transition:
                                'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
                              '@media (prefers-reduced-motion: reduce)': {
                                transition: 'none',
                              },
                            }}
                          />
                        }
                        sx={{
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontSize: '0.875rem',
                          minHeight: 44,
                          gridColumn: { xs: '1 / -1', sm: 'auto' },
                          justifySelf: { xs: 'stretch', sm: 'end' },
                          ...OUTLINED_CONTROL_FOCUS_VISIBLE_SX,
                        }}
                      >
                        {isExpanded
                          ? 'Masquer les détails'
                          : 'Voir les détails'}
                      </Button>
                    </Box>

                    {/* Expanded details */}
                    <Collapse in={isExpanded}>
                      <Box
                        id={`owner-viewing-details-${r.id}`}
                        role="region"
                        aria-label="Détails de la demande de visite"
                        sx={{
                          mt: 2,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 1.5,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={700}
                              textTransform="uppercase"
                            >
                              Créneau
                            </Typography>
                            <Typography variant="body2">
                              {r.slot_date} de {r.slot_starts_at} à{' '}
                              {r.slot_ends_at}
                            </Typography>
                          </Box>
                          {r.expires_at && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={700}
                                textTransform="uppercase"
                              >
                                Expire le
                              </Typography>
                              <Typography variant="body2">
                                {formatDateShort(r.expires_at)}
                              </Typography>
                            </Box>
                          )}
                          {r.client?.phone_number && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={700}
                                textTransform="uppercase"
                              >
                                Téléphone
                              </Typography>
                              <Typography variant="body2">
                                {r.client.phone_number}
                              </Typography>
                            </Box>
                          )}
                          {r.client?.email && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={700}
                                textTransform="uppercase"
                              >
                                Email
                              </Typography>
                              <Typography variant="body2">
                                {r.client.email}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {r.landlord_notes && (
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={700}
                              textTransform="uppercase"
                            >
                              Mes notes
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 0.5,
                                p: 1.5,
                                borderRadius: 1.5,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {r.landlord_notes}
                            </Typography>
                          </Box>
                        )}

                        {r.cancellation_reason && (
                          <Alert severity="error" sx={{ borderRadius: 2 }}>
                            <Typography variant="body2" fontWeight={600}>
                              Motif d&apos;annulation :
                            </Typography>
                            <Typography variant="body2">
                              {r.cancellation_reason}
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={meta.last_page}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                shape="rounded"
                aria-label="Pagination des demandes de visite"
              />
            </Box>
          )}
        </>
      )}

      {/* ── Confirm Dialog ── */}
      <Dialog
        open={!!confirmDialog}
        onClose={() => {
          if (!confirmMutation.isPending) {
            setConfirmDialog(null);
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmer la visite</DialogTitle>
        <DialogContent>
          {confirmDialog && (
            <Typography variant="body2" color="text.secondary">
              Confirmez la visite du{' '}
              <strong>
                {formatDateTime(
                  confirmDialog.slot_date,
                  confirmDialog.slot_starts_at
                )}
              </strong>{' '}
              pour{' '}
              <strong>
                {confirmDialog.client?.firstname}{' '}
                {confirmDialog.client?.lastname}
              </strong>{' '}
              ? Le locataire sera notifié par email.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmDialog(null)}
            disabled={confirmMutation.isPending}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              minHeight: 44,
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() =>
              confirmDialog && confirmMutation.mutate(confirmDialog.id)
            }
            disabled={confirmMutation.isPending}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 44,
            }}
          >
            {confirmMutation.isPending
              ? 'Confirmation...'
              : 'Confirmer la visite'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel Dialog ── */}
      <Dialog
        open={!!cancelDialog}
        onClose={() => {
          if (!cancelMutation.isPending) {
            setCancelDialog(null);
            setCancelReason('');
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Annuler la visite ?
        </DialogTitle>
        <DialogContent>
          {cancelDialog && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cette action est visible par le locataire. Confirmez
                l&apos;annulation de la visite du{' '}
                <strong>
                  {formatDateTime(
                    cancelDialog.slot_date,
                    cancelDialog.slot_starts_at
                  )}
                </strong>{' '}
                pour{' '}
                <strong>
                  {cancelDialog.client?.firstname}{' '}
                  {cancelDialog.client?.lastname}
                </strong>
                .
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Motif d'annulation (optionnel)"
                placeholder="Ex: Bien déjà réservé, indisponibilité..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setCancelDialog(null);
              setCancelReason('');
            }}
            disabled={cancelMutation.isPending}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              minHeight: 44,
            }}
          >
            Retour
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              cancelDialog &&
              cancelMutation.mutate({
                id: cancelDialog.id,
                reason: cancelReason || undefined,
              })
            }
            disabled={cancelMutation.isPending}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 44,
            }}
          >
            {cancelMutation.isPending ? 'Annulation...' : 'Annuler la visite'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Notes Dialog ── */}
      <Dialog
        open={!!notesDialog}
        onClose={() => {
          if (!notesMutation.isPending) {
            setNotesDialog(null);
            setNotesValue('');
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Notes personnelles</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ces notes sont privées et visibles uniquement par vous.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Mes notes"
            placeholder="Ex: Le locataire semble sérieux, a demandé des informations sur le bail..."
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setNotesDialog(null);
              setNotesValue('');
            }}
            disabled={notesMutation.isPending}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              minHeight: 44,
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              notesDialog &&
              notesMutation.mutate({ id: notesDialog.id, notes: notesValue })
            }
            disabled={notesMutation.isPending}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 44,
            }}
          >
            {notesMutation.isPending ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
