'use client';

import { useAuth } from '@/providers/AuthProvider';
import { brand, brandAgent } from '@/theme/tokens';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

type Panel = 'client' | 'owner';

/**
 * Full-screen overlay shown during logout.
 *
 * Auto-themes based on the current path:
 *   - `/owner/*`  → teal logo + teal accent (owner panel)
 *   - everything else → pink logo + pink accent (client / default panel)
 *
 * This guarantees the visible state matches the panel the user was just in,
 * even when the global LogoutOverlay is mounted once at the root layout.
 */
export default function LogoutOverlay() {
  const { isLoggingOut } = useAuth();
  const pathname = usePathname();

  if (!isLoggingOut) {
    return null;
  }

  const panel: Panel = (pathname ?? '').startsWith('/owner')
    ? 'owner'
    : 'client';

  const accent = panel === 'owner' ? brandAgent.primary : brand.primary;
  const logoSrc =
    panel === 'owner' ? '/images/logo-teal.png' : '/images/logo.png';
  const headline = panel === 'owner' ? 'À très vite !' : 'À bientôt !';

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label="Déconnexion en cours"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        animation: 'logoutFadeIn 0.4s ease-out',
        '@keyframes logoutFadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
          '& *': { animation: 'none !important' },
        },
      }}
    >
      <Box
        sx={{
          mb: 3,
          animation: 'logoutPulse 1.2s ease-in-out infinite',
          '@keyframes logoutPulse': {
            '0%, 100%': { transform: 'scale(1)', opacity: 0.92 },
            '50%': { transform: 'scale(1.06)', opacity: 1 },
          },
        }}
      >
        <Image
          src={logoSrc}
          alt="KeyHome"
          width={56}
          height={56}
          priority
          // Force a fresh DOM node when the panel switches so the browser
          // doesn't reuse a previously-cached pink logo for an owner logout.
          key={logoSrc}
        />
      </Box>
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{
          color: 'text.primary',
          animation: 'logoutSlideUp 0.5s ease-out 0.4s both',
          '@keyframes logoutSlideUp': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {headline}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mt: 0.5,
          animation: 'logoutSlideUp 0.5s ease-out 0.65s both',
        }}
      >
        Déconnexion en cours...
      </Typography>
      {/* Bottom accent bar — subtle confirmation of the active theme */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
          opacity: 0.7,
        }}
      />
    </Box>
  );
}
