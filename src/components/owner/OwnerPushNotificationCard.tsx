'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import NotifyIcon from '@mui/icons-material/NotificationsActive';
import NotifyOffIcon from '@mui/icons-material/NotificationsOff';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useState } from 'react';

export default function OwnerPushNotificationCard() {
  const { isSupported, permission, isSubscribed, subscribe, unsubscribe } =
    usePushNotifications();
  const [busy, setBusy] = useState(false);

  if (!isSupported) {
    return (
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          mt: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight={700}
          >
            Notifications
          </Typography>
          <AppAlert
            severity="info"
            message="Les notifications push ne sont pas disponibles sur ce navigateur ou la clé VAPID n’est pas configurée (NEXT_PUBLIC_VAPID_PUBLIC_KEY)."
            sx={{ mt: 1 }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        mt: 3,
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ px: 2, pt: 2, display: 'block', fontWeight: 700 }}
        >
          Notifications push
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, pb: 1 }}
        >
          Recevez des alertes (nouvelles demandes de visite, etc.) même quand
          l’app est en arrière-plan ou installée (PWA).
        </Typography>
        <List disablePadding>
          {isSubscribed ? (
            <ListItemButton
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await unsubscribe();
                } finally {
                  setBusy(false);
                }
              }}
              sx={{ borderRadius: 1, mx: 1, mb: 1 }}
            >
              <ListItemIcon sx={{ color: 'error.main' }}>
                {busy ? <CircularProgress size={22} /> : <NotifyOffIcon />}
              </ListItemIcon>
              <ListItemText
                primary="Désactiver les notifications"
                secondary="Vous ne recevrez plus de push sur cet appareil."
              />
            </ListItemButton>
          ) : (
            <Box sx={{ px: 2, pb: 2 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={
                  busy ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <NotifyIcon />
                  )
                }
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await subscribe();
                  } finally {
                    setBusy(false);
                  }
                }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Activer les notifications
              </Button>
              {permission === 'denied' && (
                <AppAlert
                  severity="warning"
                  message="Les notifications sont bloquées dans les réglages du navigateur. Autorisez KeyHome pour cette origine, puis réessayez."
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          )}
        </List>
      </CardContent>
    </Card>
  );
}
