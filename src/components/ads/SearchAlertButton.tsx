'use client';

import { useAuth } from '@/providers/AuthProvider';
import {
  searchAlertsService,
  SearchAlertPayload,
} from '@/services/searchAlerts.service';
import NotificationsActive from '@mui/icons-material/NotificationsActive';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import type { SxProps, Theme } from '@mui/material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface Props {
  prefill?: Partial<SearchAlertPayload>;
  variant?: 'icon' | 'button';
  size?: 'small' | 'medium' | 'large';
  sx?: SxProps<Theme>;
}

export default function SearchAlertButton({
  prefill = {},
  variant = 'button',
  size = 'medium',
  sx,
}: Props) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(prefill.label ?? '');
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const { data: alertsData } = useQuery({
    queryKey: ['search-alerts'],
    queryFn: () => searchAlertsService.list(),
    enabled: isAuthenticated && open,
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: SearchAlertPayload) =>
      searchAlertsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-alerts'] });
      setSaved(true);
      setTimeout(() => {
        setOpen(false);
        setSaved(false);
      }, 1500);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => searchAlertsService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['search-alerts'] }),
  });

  const handleSave = () => {
    createMutation.mutate({ ...prefill, label: label || undefined });
  };

  if (!isAuthenticated) {
    return null;
  }

  const trigger =
    variant === 'icon' ? (
      <Tooltip title="Créer une alerte pour cette recherche">
        <IconButton
          onClick={() => setOpen(true)}
          color="primary"
          aria-label="Créer une alerte pour cette recherche"
        >
          <NotificationsNone />
        </IconButton>
      </Tooltip>
    ) : (
      <Button
        variant="outlined"
        startIcon={<NotificationsNone />}
        onClick={() => setOpen(true)}
        size={size}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 99,
          whiteSpace: 'nowrap',
          ...sx,
        }}
      >
        Créer une alerte
      </Button>
    );

  return (
    <>
      {trigger}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : undefined } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          <NotificationsActive
            color="primary"
            sx={{ mr: 1, verticalAlign: 'middle' }}
          />
          Alertes de recherche
        </DialogTitle>
        <DialogContent>
          {saved ? (
            <Box textAlign="center" py={3}>
              <NotificationsActive color="success" sx={{ fontSize: 48 }} />
              <Typography variant="h6" mt={1}>
                Alerte créée !
              </Typography>
              <Typography color="text.secondary">
                Vous serez notifié dès qu&apos;une annonce correspond.
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.50',
                  borderRadius: 2,
                  mb: 2.5,
                  border: '1px solid',
                  borderColor: 'primary.100',
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="primary.main"
                  mb={0.5}
                >
                  Comment ça marche ?
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Dès qu&apos;une nouvelle annonce correspondant à vos critères
                  est publiée, vous recevrez une notification push et un email
                  automatiquement.
                </Typography>
              </Box>

              {(prefill.city_name ||
                prefill.type_name ||
                prefill.price_min ||
                prefill.price_max ||
                prefill.surface_min ||
                prefill.bedrooms_min) && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {prefill.city_name && (
                    <Chip
                      label={`Ville : ${prefill.city_name}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {prefill.type_name && (
                    <Chip
                      label={`Type : ${prefill.type_name}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {Boolean(prefill.price_min) && (
                    <Chip
                      label={`Min : ${prefill.price_min!.toLocaleString('fr-FR')} FCFA`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {Boolean(prefill.price_max) && (
                    <Chip
                      label={`Max : ${prefill.price_max!.toLocaleString('fr-FR')} FCFA`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {Boolean(prefill.surface_min) && (
                    <Chip
                      label={`Surface ≥ ${prefill.surface_min} m²`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {prefill.bedrooms_min && (
                    <Chip
                      label={`${prefill.bedrooms_min}+ ch.`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              )}

              <TextField
                label="Nom de l'alerte (optionnel)"
                fullWidth
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Appartement Bastos budget 150k"
                size="small"
              />

              {/* Existing alerts */}
              {alertsData?.data && alertsData.data.length > 0 && (
                <Box mt={3}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>
                    Mes alertes actives ({alertsData.data.length}/10)
                  </Typography>
                  {alertsData.data.map((alert) => (
                    <Box
                      key={alert.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {alert.label ?? 'Alerte sans nom'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[alert.city_name, alert.type_name]
                            .filter(Boolean)
                            .join(' · ')}
                          {alert.price_max
                            ? ` · Max ${alert.price_max.toLocaleString('fr-FR')} FCFA`
                            : ''}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => deleteMutation.mutate(alert.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Supprimer
                      </Button>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        {!saved && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)}>Annuler</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={createMutation.isPending}
              startIcon={
                createMutation.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <NotificationsActive />
                )
              }
            >
              Enregistrer l&apos;alerte
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
