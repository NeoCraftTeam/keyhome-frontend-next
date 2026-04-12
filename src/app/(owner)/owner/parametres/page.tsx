'use client';

import OwnerPushNotificationCard from '@/components/owner/OwnerPushNotificationCard';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import {
  ownerService,
  type NotificationPreferences,
} from '@/services/owner.service';
import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode, type ThemeChoice } from '@/providers/ThemeProvider';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  SettingsBrightness as SystemIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import FadeIn from '@/components/ui/FadeIn';

const NOTIFICATION_TOGGLES: {
  key: keyof NotificationPreferences;
  label: string;
}[] = [
  { key: 'new_viewing_request', label: 'Nouvelles demandes de visite' },
  { key: 'viewing_confirmed', label: 'Visite confirmée' },
  { key: 'new_review', label: 'Nouvel avis' },
  { key: 'payment_received', label: 'Paiement reçu' },
  { key: 'ad_expired', label: 'Annonce expirée' },
  { key: 'lease_expiring', label: 'Bail expirant' },
  { key: 'new_message', label: 'Nouveau message' },
];

const CHANNEL_TOGGLES: { key: keyof NotificationPreferences; label: string }[] =
  [
    { key: 'email_enabled', label: 'Email' },
    { key: 'push_enabled', label: 'Push' },
    { key: 'sms_enabled', label: 'SMS' },
  ];

export default function OwnerParametresPage() {
  const { logout } = useAuth();
  const { choice, setThemeChoice } = useThemeMode();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const queryClient = useQueryClient();
  const [prefSnackbar, setPrefSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const [automations, setAutomations] = useState<Record<string, boolean>>(
    () => {
      if (typeof window === 'undefined') return {};
      try {
        return JSON.parse(localStorage.getItem('kh_automations') ?? '{}');
      } catch {
        return {};
      }
    }
  );

  const toggleAutomation = (key: string, value: boolean): void => {
    const next = { ...automations, [key]: value };
    setAutomations(next);
    localStorage.setItem('kh_automations', JSON.stringify(next));
  };

  const { data: notifPrefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => ownerService.getNotificationPreferences(),
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (prefs: Partial<NotificationPreferences>) =>
      ownerService.updateNotificationPreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: () => {
      setPrefSnackbar({
        message: 'Erreur lors de la mise à jour des préférences',
        severity: 'error',
      });
    },
  });

  const handlePrefToggle = (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    updatePrefsMutation.mutate({ [key]: value });
  };

  const themeOptions: {
    value: ThemeChoice;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: 'light', label: 'Clair', icon: <LightModeIcon /> },
    { value: 'dark', label: 'Sombre', icon: <DarkModeIcon /> },
    { value: 'system', label: 'Système', icon: <SystemIcon /> },
  ];

  return (
    <Container
      maxWidth={false}
      sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, md: 4 } }}
    >
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Paramètres' },
          ]}
        />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Paramètres
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Personnalisez votre espace propriétaire.
        </Typography>
      </FadeIn>

      <Grid container spacing={3} alignItems="flex-start">
        {/* ── LEFT col: Apparence + Push + Logout ── */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ px: 2, pt: 2, display: 'block', fontWeight: 700 }}
                >
                  Apparence
                </Typography>
                <List disablePadding>
                  {themeOptions.map((opt) => (
                    <ListItemButton
                      key={opt.value}
                      selected={choice === opt.value}
                      onClick={() => setThemeChoice(opt.value)}
                      sx={{ borderRadius: 1, mx: 1, mb: 0.5 }}
                    >
                      <ListItemIcon
                        sx={{
                          color:
                            choice === opt.value
                              ? 'primary.main'
                              : 'text.secondary',
                        }}
                      >
                        {opt.icon}
                      </ListItemIcon>
                      <ListItemText primary={opt.label} />
                    </ListItemButton>
                  ))}
                </List>
              </CardContent>
            </Card>

            <OwnerPushNotificationCard />

            <Box>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={() => setLogoutOpen(true)}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Se déconnecter
              </Button>
            </Box>
          </Stack>
        </Grid>
        {/* end left col */}

        {/* ── RIGHT col: Notification Prefs + Automations ── */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={3}>
            {/* Notification Preferences */}
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ px: 2, pt: 2, display: 'block', fontWeight: 700 }}
                >
                  Préférences de notifications
                </Typography>
                {prefsLoading ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 3 }}
                  >
                    <CircularProgress size={28} />
                  </Box>
                ) : (
                  <Box sx={{ px: 2, pb: 2 }}>
                    {NOTIFICATION_TOGGLES.map((item) => (
                      <FormControlLabel
                        key={item.key}
                        control={
                          <Switch
                            checked={Boolean(notifPrefs?.[item.key])}
                            onChange={(e) =>
                              handlePrefToggle(item.key, e.target.checked)
                            }
                            disabled={updatePrefsMutation.isPending}
                            size="small"
                          />
                        }
                        label={item.label}
                        labelPlacement="start"
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          ml: 0,
                          py: 0.75,
                          '& .MuiFormControlLabel-label': {
                            fontSize: '0.875rem',
                          },
                        }}
                      />
                    ))}
                    <Divider sx={{ my: 1.5 }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1, fontWeight: 600 }}
                    >
                      Canaux
                    </Typography>
                    {CHANNEL_TOGGLES.map((item) => (
                      <FormControlLabel
                        key={item.key}
                        control={
                          <Switch
                            checked={Boolean(notifPrefs?.[item.key])}
                            onChange={(e) =>
                              handlePrefToggle(item.key, e.target.checked)
                            }
                            disabled={updatePrefsMutation.isPending}
                            size="small"
                          />
                        }
                        label={item.label}
                        labelPlacement="start"
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          ml: 0,
                          py: 0.75,
                          '& .MuiFormControlLabel-label': {
                            fontSize: '0.875rem',
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    Automatisations
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: 'warning.main',
                      color: 'warning.contrastText',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                    }}
                  >
                    BÊTA
                  </Typography>
                </Box>
                <List disablePadding>
                  {(
                    [
                      {
                        key: 'auto_hide_stale_ads',
                        label:
                          'Masquer les annonces sans activité depuis 30 jours',
                        defaultOn: false,
                      },
                      {
                        key: 'auto_thankyou_after_visit',
                        label:
                          'Envoyer un message de remerciement après une visite',
                        defaultOn: true,
                      },
                      {
                        key: 'monthly_email_report',
                        label: 'Recevoir un rapport mensuel par email',
                        defaultOn: true,
                      },
                    ] as { key: string; label: string; defaultOn: boolean }[]
                  ).map((item) => (
                    <Box
                      key={item.key}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.75,
                      }}
                    >
                      <Typography variant="body2">{item.label}</Typography>
                      <Switch
                        checked={automations[item.key] ?? item.defaultOn}
                        onChange={(e) =>
                          toggleAutomation(item.key, e.target.checked)
                        }
                        size="small"
                      />
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
        {/* end right col */}
      </Grid>
      {/* end grid */}

      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Se déconnecter ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir quitter votre espace propriétaire ?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setLogoutOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              setLogoutOpen(false);
              logout('/owner/login');
            }}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Déconnexion
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(prefSnackbar)}
        autoHideDuration={4000}
        onClose={() => setPrefSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={prefSnackbar?.severity}
          onClose={() => setPrefSnackbar(null)}
          sx={{ borderRadius: 2 }}
        >
          {prefSnackbar?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
