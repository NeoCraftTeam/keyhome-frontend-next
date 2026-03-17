'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Slide,
  Snackbar,
  Typography,
} from '@mui/material';
import { Close, GetApp, SystemUpdate } from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Prompt — aesthetic bottom banner that appears when:
 * 1. The browser fires `beforeinstallprompt` (installable)
 * 2. User hasn't dismissed it in this session
 *
 * Also handles the "new version available" toast from the service worker.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Dismiss key — don't re-show until next session
  const DISMISS_KEY = 'kh_pwa_dismissed';

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Listen for SW update event
  useEffect(() => {
    const handler = () => setUpdateAvailable(true);
    window.addEventListener('sw-updated', handler);
    return () => window.removeEventListener('sw-updated', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
  }, []);

  const handleUpdate = useCallback(() => {
    setUpdateAvailable(false);
    window.location.reload();
  }, []);

  return (
    <>
      {/* Install banner */}
      <Slide direction="up" in={showBanner} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: {
              xs: 'max(16px, env(safe-area-inset-bottom, 16px))',
              sm: 24,
            },
            left: { xs: 12, sm: '50%' },
            right: { xs: 12, sm: 'auto' },
            transform: { xs: 'none', sm: 'translateX(-50%)' },
            width: { xs: 'auto', sm: 420 },
            maxWidth: 420,
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              flexDirection: 'row',
              alignItems: 'center',
              gap: { xs: 1.5, sm: 2 },
              bgcolor: 'background.paper',
              borderRadius: 3,
              p: { xs: 1.5, sm: 2 },
              boxShadow: '0 16px 48px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <Box
              sx={{
                width: { xs: 40, sm: 44 },
                height: { xs: 40, sm: 44 },
                borderRadius: 2,
                bgcolor: 'rgba(246,71,95,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GetApp sx={{ color: 'primary.main', fontSize: { xs: 20, sm: 24 } }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}
              >
                Installer KeyHome
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.3, display: 'block' }}
              >
                Accès rapide depuis votre écran d&apos;accueil
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={handleInstall}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                py: 0.75,
                fontSize: '0.8rem',
                background: 'linear-gradient(to right, #F6475F, #D93A50)',
                '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                flexBasis: { xs: '100%', sm: 'auto' },
                flexShrink: 0,
              }}
            >
              Installer
            </Button>
            <IconButton
              size="small"
              aria-label="Fermer"
              onClick={handleDismiss}
              sx={{ color: 'text.secondary', flexShrink: 0, ml: { xs: 'auto', sm: -0.5 } }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </Slide>

      {/* Update available snackbar */}
      <Snackbar
        open={updateAvailable}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          icon={<SystemUpdate />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleUpdate}
              sx={{ fontWeight: 600 }}
            >
              Mettre à jour
            </Button>
          }
          sx={{ borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
        >
          Une nouvelle version est disponible
        </Alert>
      </Snackbar>
    </>
  );
}
