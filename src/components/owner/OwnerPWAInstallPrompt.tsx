'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box, Button, IconButton, Slide, Typography } from '@mui/material';
import Close from '@mui/icons-material/Close';
import PhoneAndroid from '@mui/icons-material/PhoneAndroid';
import { brandAgent } from '@/theme/tokens';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'kh_owner_pwa_dismissed';
const SESSION_SHOWN = 'kh_owner_pwa_shown';

/**
 * Owner-specific PWA install prompt.
 * Appears once per session after the first dashboard visit, using
 * owner-appropriate messaging ("gérez vos annonces hors connexion").
 * Separate dismiss state from the customer install prompt.
 */
export default function OwnerPWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    const shownThisSession = sessionStorage.getItem(SESSION_SHOWN);
    if (dismissed || shownThisSession) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      sessionStorage.setItem(SESSION_SHOWN, '1');
      // Delay slightly so the dashboard renders first
      setTimeout(() => setShowBanner(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISS_KEY, '1');
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, '1');
  }, []);

  return (
    <>
      {/* Install banner — owner-specific messaging */}
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
            width: { xs: 'auto', sm: 440 },
            maxWidth: 440,
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: { xs: 1.5, sm: 2 },
              bgcolor: 'background.paper',
              borderRadius: 3,
              p: { xs: 1.5, sm: 2 },
              boxShadow:
                '0 16px 48px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                width: { xs: 40, sm: 44 },
                height: { xs: 40, sm: 44 },
                borderRadius: 2,
                bgcolor: `${brandAgent.primary}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PhoneAndroid
                sx={{ color: brandAgent.primary, fontSize: { xs: 20, sm: 24 } }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ lineHeight: 1.3 }}
              >
                Installer l&apos;espace propriétaire
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.3, display: 'block' }}
              >
                Gérez vos annonces &amp; visites sans navigateur
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
                bgcolor: brandAgent.primary,
                '&:hover': {
                  bgcolor: brandAgent.primaryDark ?? brandAgent.primary,
                },
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
    </>
  );
}
