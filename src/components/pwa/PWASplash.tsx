'use client';

import { Box } from '@mui/material';
import Image from 'next/image';
import { useEffect, useState } from 'react';

/**
 * Animated PWA launch splash overlay shown for ~900ms on the very first paint
 * inside an installed PWA (`display-mode: standalone`). Hands off seamlessly
 * from the static iOS splash images declared in `IosSplashLinks` and from the
 * Android auto-generated splash.
 *
 * Brand-aware via the `panel` prop:
 *   - client → crimson background (#F6475F) + white logo
 *   - owner  → deep teal background (#134E4A) + teal logo
 *
 * Skipped entirely outside standalone mode (browser visits keep the regular
 * UI) and on subsequent in-session navigations (sessionStorage flag).
 */

interface PWASplashProps {
  panel: 'client' | 'owner';
}

/** sessionStorage key — scoped per panel so opening client then owner still fires once each. */
const flagKey = (panel: 'client' | 'owner') => `kh-pwa-splash-shown:${panel}`;
const HOLD_MS = 900;
const FADE_MS = 350;

const BRAND = {
  client: {
    bg: '#F6475F',
    logo: '/images/logo.png',
    accent: 'rgba(255,255,255,0.85)',
    track: 'rgba(255,255,255,0.18)',
  },
  owner: {
    bg: '#134E4A',
    logo: '/images/logo-teal.png',
    accent: '#5EEAD4',
    track: 'rgba(94,234,212,0.18)',
  },
} as const;

export default function PWASplash({ panel }: PWASplashProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari legacy
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (!isStandalone) return;

    // One splash per panel per session — avoids re-triggering on tab focus or HMR.
    const key = flagKey(panel);
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');

    setVisible(true);
    const fadeTimer = window.setTimeout(() => setFading(true), HOLD_MS);
    const removeTimer = window.setTimeout(
      () => setVisible(false),
      HOLD_MS + FADE_MS
    );

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [panel]);

  if (!visible) return null;

  const brand = BRAND[panel];

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label="Chargement de KeyHome"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: brand.bg,
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: 'none',
        // Cover iOS notch + Android navigation bar
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
      }}
    >
      {/* Logo — spring scale + subtle pulse */}
      <Box
        sx={{
          width: 96,
          height: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: `kh-splash-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both,
                      kh-splash-pulse 1.6s ease-in-out 0.55s infinite`,
          '@keyframes kh-splash-in': {
            '0%': { opacity: 0, transform: 'scale(0.55)' },
            '100%': { opacity: 1, transform: 'scale(1)' },
          },
          '@keyframes kh-splash-pulse': {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.06)' },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }}
      >
        <Image
          src={brand.logo}
          alt=""
          width={96}
          height={96}
          priority
          style={{ objectFit: 'contain' }}
        />
      </Box>

      {/* Wordmark */}
      <Box
        component="span"
        sx={{
          mt: 2,
          fontFamily: 'var(--font-jakarta), system-ui, sans-serif',
          fontSize: '1.5rem',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          color: panel === 'client' ? '#FFFFFF' : '#FFFFFF',
          animation: 'kh-splash-fade-up 0.45s ease 0.2s both',
          '@keyframes kh-splash-fade-up': {
            '0%': { opacity: 0, transform: 'translateY(8px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            opacity: 1,
            transform: 'none',
          },
        }}
      >
        KeyHome
      </Box>

      {/* Tagline */}
      <Box
        component="span"
        sx={{
          mt: 0.5,
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
          fontSize: '0.8125rem',
          fontWeight: 500,
          letterSpacing: '0.2px',
          color: brand.accent,
          opacity: 0.9,
          animation: 'kh-splash-fade-up 0.45s ease 0.32s both',
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            opacity: 0.9,
          },
        }}
      >
        Votre patrimoine immobilier en poche
      </Box>

      {/* Indeterminate progress dot loader */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 'calc(env(safe-area-inset-bottom) + 56px)',
          display: 'flex',
          gap: 1,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: brand.accent,
              animation: `kh-splash-dot 1.2s ease-in-out ${i * 0.16}s infinite`,
              '@keyframes kh-splash-dot': {
                '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
                '40%': { transform: 'scale(1)', opacity: 1 },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
                opacity: 0.6,
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
