'use client';

import { API_URL } from '@/lib/api';
import { brand, brandAgent } from '@/theme/tokens';
import Close from '@mui/icons-material/Close';
import CookieOutlined from '@mui/icons-material/CookieOutlined';
import Shield from '@mui/icons-material/Shield';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Paper,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

const COOKIE_KEY = 'keyhome_cookie_consent_v1';
const POLICY_VERSION = 'v1';

interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  consented_at?: string;
  policy_version?: string;
}

const DEFAULT_PREFS: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function loadPrefs(): CookiePreferences | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    return raw ? (JSON.parse(raw) as CookiePreferences) : null;
  } catch {
    return null;
  }
}

function savePrefs(prefs: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  const enriched: CookiePreferences = {
    ...prefs,
    consented_at: new Date().toISOString(),
    policy_version: POLICY_VERSION,
  };
  try {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(enriched));
    window.dispatchEvent(
      new CustomEvent('kh:cookie-consent', { detail: enriched })
    );
  } catch {
    // localStorage may be full or disabled (private mode)
  }
  // Fire-and-forget server-side log for CNIL proof of consent (Art. 5-1-a)
  void fetch(`${API_URL}/consent/cookies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      analytics: enriched.analytics,
      marketing: enriched.marketing,
      policy_version: POLICY_VERSION,
    }),
    credentials: 'include',
  }).catch(() => {
    // Non-fatal — consent is already saved in localStorage
  });
}

interface CookieBannerProps {
  /**
   * Optional explicit variant. When omitted (default), the banner detects the
   * panel from the current pathname (`/owner/*` → owner, else default). This
   * is the correct mode for a single global mount at the root layout — only
   * one banner is rendered and it re-themes itself on navigation, so the user
   * never sees the pink → teal flash that double-mounting caused.
   */
  variant?: 'default' | 'owner' | 'auto';
}

export default function CookieBanner({ variant = 'auto' }: CookieBannerProps) {
  const pathname = usePathname();
  const dialogTitleId = useId();

  // Starts false on SSR — banner is never server-rendered (avoids hydration mismatch).
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  // Dialog prefs are seeded from localStorage each time it opens so the user
  // always sees their last-saved state — not stale in-memory state from a
  // previous open-then-cancel sequence.
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_PREFS);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const isOwner =
    variant === 'owner' ||
    (variant === 'auto' && (pathname ?? '').startsWith('/owner'));
  const accentColor = isOwner ? brandAgent.primary : brand.primary;
  const accentBar = isOwner
    ? `linear-gradient(to right, ${brandAgent.primaryLight}, ${brandAgent.primary})`
    : `linear-gradient(to right, ${brand.primary}, #6c5ce7)`;
  const btnBg = isOwner ? brandAgent.primary : brand.primary;

  // Show the banner once — only if the user has not yet saved preferences.
  useEffect(() => {
    if (loadPrefs() === null) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  // Allow the footer "Cookies" link to re-open the banner at any time.
  useEffect(() => {
    const handler = () => {
      setPrefs(loadPrefs() ?? DEFAULT_PREFS);
      setCustomizeOpen(false);
      setVisible(true);
    };
    window.addEventListener('kh:reopen-cookie-banner', handler);
    return () => window.removeEventListener('kh:reopen-cookie-banner', handler);
  }, []);

  // Seed the dialog prefs from localStorage each time it opens so the user
  // always sees their currently saved state (fixes stale-toggle bug when the
  // dialog is opened, cancelled, then reopened in the same session).
  useEffect(() => {
    if (customizeOpen) {
      setPrefs(loadPrefs() ?? DEFAULT_PREFS);
    }
  }, [customizeOpen]);

  const acceptAll = () => {
    savePrefs({ necessary: true, analytics: true, marketing: true });
    setVisible(false);
  };
  const rejectAll = () => {
    savePrefs(DEFAULT_PREFS);
    setVisible(false);
  };
  const saveCustom = () => {
    savePrefs(prefs);
    setCustomizeOpen(false);
    setVisible(false);
  };
  const openCustomize = () => setCustomizeOpen(true);
  const closeCustomize = () => {
    setCustomizeOpen(false);
    // Reset dialog prefs to avoid stale state on next open.
    setPrefs(loadPrefs() ?? DEFAULT_PREFS);
  };

  // Never return null early — AnimatePresence must own the mount/unmount
  // of the motion.div so the exit animation can play when visible → false.
  // Returning null here would bypass AnimatePresence entirely.
  return (
    <MotionConfig reducedMotion="user">
      {/* Banner — exit animation plays correctly because AnimatePresence
          detects the key removal while it is still in the tree. */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="cookie-banner"
            role="region"
            aria-label="Préférences de cookies"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              // Delay only on enter; exit should be immediate so it feels
              // responsive when the user clicks accept/reject.
            }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1400,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                mx: { xs: 0, sm: 2, md: 'auto' },
                maxWidth: { md: 780 },
                mb: { xs: 0, sm: 2 },
                borderRadius: { xs: '12px 12px 0 0', sm: 3 },
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 -2px 24px rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ height: 3, background: accentBar }} />

              <Box
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1.75, sm: 2 },
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { sm: 'center' },
                  gap: { xs: 1.5, sm: 2.5 },
                }}
              >
                {/* Icon + text */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <CookieOutlined
                    sx={{ color: accentColor, fontSize: 20, flexShrink: 0 }}
                    aria-hidden
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.5 }}
                  >
                    <Typography
                      component="span"
                      variant="body2"
                      fontWeight={700}
                      color="text.primary"
                    >
                      Cookies —{' '}
                    </Typography>
                    KeyHome utilise des cookies pour améliorer votre expérience.{' '}
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        color: accentColor,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                        whiteSpace: 'nowrap',
                      }}
                      onClick={openCustomize}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') openCustomize();
                      }}
                      aria-haspopup="dialog"
                    >
                      En savoir plus
                    </Typography>
                  </Typography>
                </Box>

                {/* Actions */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flexShrink: 0,
                    alignItems: 'center',
                  }}
                >
                  <Button
                    type="button"
                    size="small"
                    variant="text"
                    onClick={rejectAll}
                    sx={{
                      textTransform: 'none',
                      color: 'text.disabled',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Refuser
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    variant="outlined"
                    onClick={openCustomize}
                    aria-haspopup="dialog"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      borderColor: 'divider',
                      color: 'text.primary',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Personnaliser
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    variant="contained"
                    onClick={acceptAll}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      whiteSpace: 'nowrap',
                      background: btnBg,
                      '&:hover': {
                        filter: 'brightness(0.9)',
                        background: btnBg,
                      },
                    }}
                  >
                    Tout accepter
                  </Button>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customize Dialog — rendered outside AnimatePresence and outside the
          {visible} condition so it stays accessible during the banner exit
          animation and doesn't vanish abruptly if opened while visible=false. */}
      <Dialog
        open={customizeOpen}
        onClose={closeCustomize}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        aria-labelledby={dialogTitleId}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield sx={{ color: accentColor, fontSize: 18 }} aria-hidden />
            <Typography id={dialogTitleId} fontWeight={700} fontSize={15}>
              Préférences cookies
            </Typography>
          </Box>
          <IconButton
            type="button"
            size="small"
            onClick={closeCustomize}
            aria-label="Fermer les préférences cookies"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 2.5 }}>
          {[
            {
              label: 'Essentiels',
              desc: 'Authentification, sécurité. Toujours actifs.',
              checked: true,
              disabled: true,
              onChange: undefined,
            },
            {
              label: 'Analytiques',
              desc: "Mesure d'audience anonyme (Vercel Analytics, Clarity).",
              checked: prefs.analytics,
              disabled: false,
              onChange: (v: boolean) =>
                setPrefs((p) => ({ ...p, analytics: v })),
            },
            {
              label: 'Marketing',
              desc: 'Personnalisation et publicités ciblées (Meta, TikTok, etc.).',
              checked: prefs.marketing,
              disabled: false,
              onChange: (v: boolean) =>
                setPrefs((p) => ({ ...p, marketing: v })),
            },
          ].map(({ label, desc, checked, disabled, onChange }, i, arr) => (
            <Box key={label}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1.5,
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {desc}
                  </Typography>
                </Box>
                <Switch
                  checked={checked}
                  disabled={disabled}
                  size="small"
                  inputProps={{
                    'aria-label': `Cookies ${label.toLowerCase()}${disabled ? ' (obligatoires)' : ''}`,
                  }}
                  onChange={
                    onChange ? (e) => onChange(e.target.checked) : undefined
                  }
                />
              </Box>
              {i < arr.length - 1 && <Divider />}
            </Box>
          ))}

          <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={closeCustomize}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                flex: 1,
                borderColor: 'divider',
                color: 'text.secondary',
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="contained"
              onClick={saveCustom}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                flex: 2,
                background: btnBg,
                '&:hover': { filter: 'brightness(0.9)', background: btnBg },
              }}
            >
              Sauvegarder
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </MotionConfig>
  );
}
