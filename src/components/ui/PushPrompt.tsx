'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/providers/AuthProvider';
import CloseIcon from '@mui/icons-material/Close';
import BellIcon from '@mui/icons-material/NotificationsActive';
import { Box, Button, IconButton, Slide, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const FALLBACK_DELAY_MS = 8000;

export default function PushPrompt() {
  const reduceMotion = useReducedMotion();
  const { isAuthenticated, user } = useAuth();
  const {
    isSupported,
    permission,
    isSubscribed,
    isDismissed,
    subscribe,
    dismiss,
  } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const firedDoneRef = useRef(false);

  const shouldShow =
    isAuthenticated &&
    isSupported &&
    permission === 'default' &&
    !isSubscribed &&
    !isDismissed;

  const fireDone = () => {
    if (firedDoneRef.current) return;
    firedDoneRef.current = true;
    window.dispatchEvent(new CustomEvent('kh:push-prompt-done'));
  };

  // When auth resolves and push prompt is not applicable, immediately unblock the survey
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!shouldShow) {
      fireDone();
    }
  }, [isAuthenticated, shouldShow]);

  useEffect(() => {
    if (!shouldShow) return;

    // Snapshot at setup time: new users are in the onboarding flow (AppTour → WelcomeModal).
    // For them, ONLY the kh:welcome-dismissed event should trigger us — no fallback timer —
    // because the tour + reading the WelcomeModal easily exceeds 8 s and the fallback would
    // race against the WelcomeModal still being open.
    // Returning users (onboarding_completed_at set) will never get kh:welcome-dismissed,
    // so they rely on the fallback timer.
    const isNewUserOnboarding = user?.onboarding_completed_at == null;
    const show = () => setVisible(true);

    window.addEventListener('kh:welcome-dismissed', show, { once: true });
    const fallback = isNewUserOnboarding
      ? undefined
      : setTimeout(show, FALLBACK_DELAY_MS);

    return () => {
      window.removeEventListener('kh:welcome-dismissed', show);
      if (fallback !== undefined) clearTimeout(fallback);
    };
    // user intentionally excluded: we snapshot onboarding state at first setup only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShow]);

  if (!shouldShow || !visible) return null;

  const handleAccept = async () => {
    setLoading(true);
    const ok = await subscribe();
    setLoading(false);
    if (ok) {
      setVisible(false);
      fireDone();
    }
  };

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
    fireDone();
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
          left: 0,
          right: 0,
          mx: 'auto',
          width: { xs: 'calc(100% - 32px)', sm: 400 },
          maxWidth: 400,
          zIndex: 1400,
        }}
      >
        <Box
          component={motion.div}
          initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={
            reduceMotion
              ? undefined
              : { type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }
          }
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
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ lineHeight: 1.3, mb: 0.5 }}
            >
              Restez informé
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.5, maxWidth: 280, mx: 'auto' }}
            >
              Recevez des alertes pour les nouvelles annonces, réservations et
              messages importants.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              width: '100%',
              justifyContent: 'center',
            }}
          >
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
