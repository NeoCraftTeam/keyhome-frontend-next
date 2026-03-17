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
            xs: 'max(72px, calc(72px + env(safe-area-inset-bottom, 0px)))',
            md: 24,
          },
          left: { xs: 12, sm: '50%' },
          right: { xs: 12, sm: 'auto' },
          transform: { xs: 'none', sm: 'translateX(-50%)' },
          width: { xs: 'auto', sm: 420 },
          maxWidth: 420,
          zIndex: 1400,
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid',
          borderColor: 'divider',
          p: { xs: 1.5, sm: 2.5 },
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box
          sx={{
            width: { xs: 40, sm: 44 },
            height: { xs: 40, sm: 44 },
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BellIcon sx={{ color: '#fff', fontSize: { xs: 20, sm: 22 } }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mb: 0.5, wordBreak: 'break-word', lineHeight: 1.3 }}
          >
            Restez informé
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, lineHeight: 1.4, wordBreak: 'break-word' }}
          >
            Recevez des alertes pour les nouvelles annonces, réservations et messages importants.
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={handleDismiss}
          aria-label="Fermer"
          sx={{
            color: 'text.secondary',
            flexShrink: 0,
            alignSelf: { xs: 'flex-start', sm: 'center' },
            order: { xs: 3, sm: 4 },
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexBasis: { xs: '100%', sm: 'auto' },
            flexShrink: 0,
            order: { xs: 4, sm: 3 },
          }}
        >
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
              flex: { xs: 1, sm: '0 0 auto' },
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
    </Slide>
  );
}
