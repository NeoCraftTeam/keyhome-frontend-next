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
          bottom: {
            xs: 'max(16px, calc(16px + env(safe-area-inset-bottom, 0px)))',
            md: 32,
          },
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: 'calc(100% - 32px)', sm: 400 },
          maxWidth: 400,
          zIndex: 1400,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 2,
            bgcolor: 'background.paper',
            borderRadius: 4,
            p: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <IconButton
            size="small"
            onClick={handleDismiss}
            aria-label="Fermer"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'text.disabled',
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>

          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BellIcon sx={{ color: '#fff', fontSize: 26 }} />
          </Box>

          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.5 }}>
              Restez informé
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.5, maxWidth: 280, mx: 'auto' }}
            >
              Recevez des alertes pour les nouvelles annonces, réservations et messages importants.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, width: '100%', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleAccept}
              disabled={loading}
              sx={{
                borderRadius: 99,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                px: 3,
                py: 1,
              }}
            >
              {loading ? 'Activation...' : 'Activer'}
            </Button>
            <Button
              variant="text"
              onClick={handleDismiss}
              sx={{
                borderRadius: 99,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                color: 'text.secondary',
                px: 2,
                py: 1,
              }}
            >
              Plus tard
            </Button>
          </Box>
        </Box>
      </Box>
    </Slide>
  );
}
