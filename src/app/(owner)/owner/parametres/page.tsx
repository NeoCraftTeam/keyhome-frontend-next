'use client';

import OwnerPushNotificationCard from '@/components/owner/OwnerPushNotificationCard';
import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode, type ThemeChoice } from '@/providers/ThemeProvider';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  SettingsBrightness as SystemIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OwnerParametresPage() {
  const { logout } = useAuth();
  const { choice, setThemeChoice } = useThemeMode();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const themeOptions: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Clair', icon: <LightModeIcon /> },
    { value: 'dark', label: 'Sombre', icon: <DarkModeIcon /> },
    { value: 'system', label: 'Système', icon: <SystemIcon /> },
  ];

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Paramètres
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Personnalisez votre espace propriétaire.
      </Typography>

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 0 }}>
          <Typography variant="overline" color="text.secondary" sx={{ px: 2, pt: 2, display: 'block', fontWeight: 700 }}>
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
                <ListItemIcon sx={{ color: choice === opt.value ? 'primary.main' : 'text.secondary' }}>
                  {opt.icon}
                </ListItemIcon>
                <ListItemText primary={opt.label} />
              </ListItemButton>
            ))}
          </List>
        </CardContent>
      </Card>

      <OwnerPushNotificationCard />

      <Box sx={{ mt: 3 }}>
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

      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Se déconnecter ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir quitter votre espace propriétaire ?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLogoutOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
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
    </Container>
  );
}
