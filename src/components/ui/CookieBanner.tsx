'use client';

import { useState, useEffect } from 'react';
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
import { Close, CookieOutlined, Shield } from '@mui/icons-material';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { brand, gradient } from '@/theme/tokens';

const COOKIE_KEY = 'keyhome_cookie_consent_v1';

interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: CookiePreferences = { necessary: true, analytics: false, marketing: false };

function loadPrefs(): CookiePreferences | null {
  if (typeof window === 'undefined') { return null; }
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    return raw ? (JSON.parse(raw) as CookiePreferences) : null;
  } catch { return null; }
}

function savePrefs(prefs: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('kh:cookie-consent', { detail: prefs }));
  } catch {
    // localStorage may be full or disabled (private mode)
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_PREFS);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    if (loadPrefs() === null) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const acceptAll = () => { savePrefs({ necessary: true, analytics: true, marketing: true }); setVisible(false); };
  const rejectAll = () => { savePrefs(DEFAULT_PREFS); setVisible(false); };
  const saveCustom = () => { savePrefs(prefs); setCustomizeOpen(false); setVisible(false); };

  if (!visible) { return null; }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1400 }}
        >
          <Paper
            elevation={0}
            sx={{
              mx: { xs: 0, sm: 2, md: 'auto' },
              maxWidth: { md: 780 },
              mb: { xs: 0, sm: 2 },
              borderRadius: { xs: '12px 12px 0 0', sm: 3 },
              border: '1px solid', borderColor: 'divider',
              boxShadow: '0 -2px 24px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ height: 3, background: `linear-gradient(to right, ${brand.primary}, #6c5ce7)` }} />

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
              {/* Icon + text — compact */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                <CookieOutlined sx={{ color: 'primary.main', fontSize: 20, flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  <Typography component="span" variant="body2" fontWeight={700} color="text.primary">
                    Cookies —{' '}
                  </Typography>
                  KeyHome utilise des cookies pour améliorer votre expérience.{' '}
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, whiteSpace: 'nowrap' }}
                    onClick={() => setCustomizeOpen(true)}
                  >
                    En savoir plus
                  </Typography>
                </Typography>
              </Box>

              {/* Actions — horizontal, compact */}
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={rejectAll}
                  sx={{ textTransform: 'none', color: 'text.disabled', fontWeight: 500, whiteSpace: 'nowrap' }}
                >
                  Refuser
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setCustomizeOpen(true)}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, borderColor: 'divider', color: 'text.primary', whiteSpace: 'nowrap' }}
                >
                  Personnaliser
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={acceptAll}
                  sx={{
                    textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap',
                    background: gradient.primary,
                    '&:hover': { filter: 'brightness(0.9)', background: gradient.primary },
                  }}
                >
                  Tout accepter
                </Button>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </AnimatePresence>

      {/* Customize Dialog */}
      <Dialog
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <Box
          sx={{
            px: 3, py: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid', borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield sx={{ color: 'primary.main', fontSize: 18 }} />
            <Typography fontWeight={700} fontSize={15}>Préférences cookies</Typography>
          </Box>
          <IconButton size="small" onClick={() => setCustomizeOpen(false)} aria-label="Fermer les préférences cookies"><Close fontSize="small" /></IconButton>
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
              desc: 'Mesure d\'audience anonyme (Vercel Analytics).',
              checked: prefs.analytics,
              disabled: false,
              onChange: (v: boolean) => setPrefs((p) => ({ ...p, analytics: v })),
            },
            {
              label: 'Marketing',
              desc: 'Personnalisation et publicités ciblées.',
              checked: prefs.marketing,
              disabled: false,
              onChange: (v: boolean) => setPrefs((p) => ({ ...p, marketing: v })),
            },
          ].map(({ label, desc, checked, disabled, onChange }, i, arr) => (
            <Box key={label}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{label}</Typography>
                  <Typography variant="caption" color="text.secondary">{desc}</Typography>
                </Box>
                <Switch
                  checked={checked}
                  disabled={disabled}
                  size="small"
                  color={disabled ? 'success' : 'primary'}
                  onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
                />
              </Box>
              {i < arr.length - 1 && <Divider />}
            </Box>
          ))}

          <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
            <Button
              variant="outlined"
              onClick={() => setCustomizeOpen(false)}
              sx={{ textTransform: 'none', borderRadius: 2, flex: 1, borderColor: 'divider', color: 'text.secondary' }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={saveCustom}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 2, flex: 2,
                background: gradient.primary,
                '&:hover': { filter: 'brightness(0.9)', background: gradient.primary },
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
