'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/providers/AuthProvider';
import { Close as CloseIcon, NotificationsActive as BellIcon } from '@mui/icons-material';
import { Box, Button, IconButton, Slide, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

const DELAY_MS = 8000;

export default function PushPrompt() {
  const { isAuthenticated } = useAuth();
  const { isSupported, permission, isSubscribed, isDismissed, subscribe, dismiss } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const shouldShow = isAuthenticated && isSupported && permission === 'default' && !isSubscribed && !isDismissed;

  useEffect(() => {
    if (!shouldShow) return;
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldShow]);

  if (!shouldShow || !visible) return null;

  const handleAccept = async () => {
    setLoading(true);
    const ok = await subscribe();
    setLoading(false);
    if (ok) setVisible(false);
  };

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 72, md: 24 },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1400,
          width: { xs: 'calc(100% - 32px)', sm: 420 },
          maxWidth: 420,
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid',
          borderColor: 'divider',
          p: 2.5,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BellIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
            Restez informé
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.4 }}>
            Recevez des alertes pour les nouvelles annonces, réservations et messages importants.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleAccept}
              disabled={loading}
              sx={{
                borderRadius: 99,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                px: 2,
              }}
            >
              {loading ? 'Activation...' : 'Activer'}
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={handleDismiss}
              sx={{
                borderRadius: 99,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.8rem',
                color: 'text.secondary',
              }}
            >
              Plus tard
            </Button>
          </Box>
        </Box>

        <IconButton
          size="small"
          onClick={handleDismiss}
          aria-label="Fermer"
          sx={{ mt: -0.5, mr: -0.5 }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Slide>
  );
}
