'use client';

import { brandAgent } from '@/theme/tokens';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Slide,
  Snackbar,
  Typography,
} from '@mui/material';
import Close from '@mui/icons-material/Close';
import GetApp from '@mui/icons-material/GetApp';
import SystemUpdate from '@mui/icons-material/SystemUpdate';
import { useCallback, useEffect, useState } from 'react';
import { useIsStandalone } from '@/hooks/useIsStandalone';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Install banner for the owner/bailleur panel (manifest-owner.json).
 * Mirrors {@link PWAInstallPrompt} but uses teal branding and a separate dismiss key.
 */
export default function OwnerPWAInstallPrompt() {
  const isStandalone = useIsStandalone();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const DISMISS_KEY = 'kh_owner_pwa_install_v1';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isStandalone]);

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
    localStorage.setItem(DISMISS_KEY, '1');
  }, []);

  const handleUpdate = useCallback(async () => {
    setUpdateAvailable(false);
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, []);

  if (isStandalone) {
    return (
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
    );
  }

  return (
    <>
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
              boxShadow:
                '0 16px 48px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06)',
              border: '1px solid',
              borderColor: brandAgent.primaryAlpha20,
            }}
          >
            <Box
              sx={{
                width: { xs: 40, sm: 44 },
                height: { xs: 40, sm: 44 },
                borderRadius: 2,
                bgcolor: brandAgent.primaryAlpha10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GetApp
                sx={{ color: brandAgent.primary, fontSize: { xs: 20, sm: 24 } }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}
              >
                Installer KeyHome Propriétaire
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.3, display: 'block' }}
              >
                Accès rapide à vos annonces et messages depuis l’écran d’accueil
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={handleInstall}
              disabled={!deferredPrompt}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                py: 0.75,
                fontSize: '0.8rem',
                bgcolor: brandAgent.primary,
                flexBasis: { xs: '100%', sm: 'auto' },
                flexShrink: 0,
                '&:hover': { bgcolor: brandAgent.primaryDark },
              }}
            >
              Installer
            </Button>
            <IconButton
              size="small"
              aria-label="Fermer"
              onClick={handleDismiss}
              sx={{
                color: 'text.secondary',
                flexShrink: 0,
                ml: { xs: 'auto', sm: -0.5 },
              }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </Slide>

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
          sx={{
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            borderLeft: `4px solid ${brandAgent.primary}`,
          }}
        >
          Une nouvelle version est disponible
        </Alert>
      </Snackbar>
    </>
  );
}
