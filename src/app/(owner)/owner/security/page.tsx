'use client';

import EmptyState from '@/components/ui/feedback/EmptyState';
import PageBreadcrumbs from '@/components/ui/layout/PageBreadcrumbs';
import api from '@/lib/api';
import { loginHistoryKeys } from '@/lib/query-keys';
import { useAuth } from '@/providers/AuthProvider';

import { ownerService, type LoginHistoryEntry } from '@/services/owner.service';
import { useUser } from '@clerk/nextjs';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Computer as ComputerIcon,
  Delete as DeleteIcon,
  DevicesOther as DevicesOtherIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Logout as LogoutIcon,
  PhoneAndroid as PhoneAndroidIcon,
  TabletMac as TabletMacIcon,
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
  DialogContentText,
  DialogTitle,
  Grid,
  Pagination,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import FadeIn from '@/components/ui/layout/FadeIn';

function DeviceIcon({ deviceType }: { deviceType: string | null }) {
  if (deviceType === 'phone' || deviceType === 'mobile') {
    return (
      <PhoneAndroidIcon fontSize="small" sx={{ color: 'text.secondary' }} />
    );
  }
  if (deviceType === 'tablet') {
    return <TabletMacIcon fontSize="small" sx={{ color: 'text.secondary' }} />;
  }
  if (deviceType === 'desktop' || deviceType === 'computer') {
    return <ComputerIcon fontSize="small" sx={{ color: 'text.secondary' }} />;
  }
  return <DevicesOtherIcon fontSize="small" sx={{ color: 'text.secondary' }} />;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OwnerSecurityPage() {
  const { logout } = useAuth();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const queryClient = useQueryClient();
  const [historyPage, setHistoryPage] = useState(1);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  // ─── Login History ───
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
  } = useQuery({
    queryKey: loginHistoryKeys.list(historyPage),
    queryFn: () => ownerService.getLoginHistory(historyPage),
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => ownerService.clearLoginHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loginHistoryKeys.all });
      setClearConfirmOpen(false);
      setSnackbar({
        message: 'Historique des connexions effacé',
        severity: 'success',
      });
    },
    onError: () => {
      setClearConfirmOpen(false);
      setSnackbar({
        message: "Erreur lors de l'effacement de l'historique",
        severity: 'error',
      });
    },
  });

  // ─── GDPR Data Export ───
  const dataExportMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get('/my/data-export');
      return data;
    },
    onSuccess: () => {
      setSnackbar({
        message: 'Votre export de données a été envoyé par email',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        message: "Erreur lors de l'export de données",
        severity: 'error',
      });
    },
  });

  const entries = historyData?.data ?? [];
  const meta = historyData?.meta;

  return (
    <Container
      maxWidth={false}
      sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, md: 4 } }}
    >
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Sécurité' },
          ]}
        />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Sécurité
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Gérez la sécurité de votre compte et vos connexions.
        </Typography>
      </FadeIn>

      <Grid container spacing={3} alignItems="flex-start">
        {/* ── LEFT col: Login History ── */}
        <Grid size={{ xs: 12, lg: 6 }}>
          {/* ─── Section 1: Login History ─── */}
          <Card
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Stack direction="row" alignItems="center" gap={1}>
                  <HistoryIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Historique des connexions
                  </Typography>
                </Stack>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setClearConfirmOpen(true)}
                  disabled={
                    entries.length === 0 || clearHistoryMutation.isPending
                  }
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Effacer l&apos;historique
                </Button>
              </Stack>

              {historyLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      variant="rectangular"
                      height={60}
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
                </Box>
              ) : historyError ? (
                <EmptyState
                  title="Impossible de charger l'historique"
                  description="Une erreur est survenue. Veuillez réessayer."
                  size="sm"
                />
              ) : entries.length === 0 ? (
                <EmptyState
                  title="Aucune connexion enregistrée"
                  description="Votre historique de connexions apparaîtra ici."
                  size="sm"
                />
              ) : (
                <>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    {entries.map((entry: LoginHistoryEntry) => (
                      <Box
                        key={entry.id}
                        sx={{
                          display: 'flex',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: { xs: 0.75, sm: 2 },
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={1}
                          sx={{ minWidth: { sm: 160 } }}
                        >
                          <DeviceIcon deviceType={entry.device_type} />
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {entry.browser ?? 'Navigateur inconnu'}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ flex: 1, minWidth: 0 }}
                          noWrap
                        >
                          {[entry.city, entry.country]
                            .filter(Boolean)
                            .join(', ') || entry.ip_address}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            minWidth: { sm: 120 },
                            textAlign: { sm: 'right' },
                          }}
                        >
                          {formatDateTime(entry.created_at)}
                        </Typography>
                        <Chip
                          size="small"
                          icon={
                            entry.successful ? (
                              <CheckCircleIcon
                                sx={{ fontSize: '14px !important' }}
                              />
                            ) : (
                              <CancelIcon
                                sx={{ fontSize: '14px !important' }}
                              />
                            )
                          }
                          label={entry.successful ? 'Réussi' : 'Échec'}
                          color={entry.successful ? 'success' : 'error'}
                          variant="outlined"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            minWidth: 80,
                          }}
                        />
                      </Box>
                    ))}
                  </Box>

                  {meta && meta.last_page > 1 && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
                    >
                      <Pagination
                        count={meta.last_page}
                        page={historyPage}
                        onChange={(_, value) => {
                          setHistoryPage(value);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        color="primary"
                        shape="rounded"
                        size="small"
                      />
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        {/* end left col */}

        {/* ── RIGHT col: Sessions + GDPR ── */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack spacing={3}>
            {/* ─── Section 2: Active Sessions ─── */}
            <Card
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={1}
                  sx={{ mb: 2 }}
                >
                  <LogoutIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Sessions actives
                  </Typography>
                </Stack>

                {!clerkLoaded ? (
                  <Skeleton
                    variant="rectangular"
                    height={80}
                    sx={{ borderRadius: 2 }}
                  />
                ) : (
                  <Box>
                    {clerkUser && (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          mb: 2,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {clerkUser.primaryEmailAddress?.emailAddress ??
                            clerkUser.fullName ??
                            'Compte actif'}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="success.main"
                          sx={{ fontWeight: 600 }}
                        >
                          ● Connecté depuis ce navigateur (session active)
                        </Typography>
                      </Box>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<LogoutIcon />}
                      onClick={() => logout('/owner/login')}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Déconnexion de tous les appareils
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* ─── Section 3: GDPR Data Export ─── */}
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={1}
                  sx={{ mb: 1.5 }}
                >
                  <DownloadIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Exporter mes données (RGPD)
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Vous pouvez demander un export de toutes vos données
                  personnelles conformément au RGPD.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => dataExportMutation.mutate()}
                  disabled={
                    dataExportMutation.isPending || dataExportMutation.isSuccess
                  }
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  {dataExportMutation.isPending
                    ? 'Envoi en cours...'
                    : 'Exporter mes données personnelles'}
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
        {/* end right col */}
      </Grid>
      {/* end container */}

      {/* ─── Confirm Clear History Dialog ─── */}
      <Dialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Effacer l&apos;historique ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cette action supprimera définitivement tout votre historique de
            connexions.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setClearConfirmOpen(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => clearHistoryMutation.mutate()}
            disabled={clearHistoryMutation.isPending}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Effacer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar ─── */}
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity={snackbar?.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
