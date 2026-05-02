'use client';

import { bottomNavigationPwaShellSx } from '@/components/layout/bottomNavigationPwaShellSx';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { OWNER_BOTTOM_NAV_ITEMS } from '@/lib/nav-config';
import { PWA_BOTTOM_NAV_INNER_HEIGHT_PX } from '@/lib/pwaBottomNavConstants';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';

/** @deprecated Prefer {@link PWA_BOTTOM_NAV_INNER_HEIGHT_PX} — kept for owner layout FAB offset */
export const OWNER_BOTTOM_NAV_HEIGHT = PWA_BOTTOM_NAV_INNER_HEIGHT_PX;

function OwnerBottomNavDashboardIcon({ selected }: { selected: boolean }) {
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="img"
        src="/images/logo-teal.png"
        alt=""
        draggable={false}
        sx={{
          width: 28,
          height: 28,
          objectFit: 'contain',
          display: 'block',
          transition: 'opacity 0.2s ease, filter 0.2s ease',
          filter: selected ? 'none' : 'grayscale(1)',
          opacity: selected ? 1 : 0.42,
        }}
      />
    </Box>
  );
}

/** Bailleur tabs — standalone PWA only (not mobile Safari/Chrome tabs). */
export default function OwnerBottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isStandalone = useIsStandalone();
  const pathname = usePathname();
  const router = useRouter();

  if (!isMobile || !isStandalone) {
    return null;
  }

  const activeIndex = OWNER_BOTTOM_NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
  );

  const handleNav = (index: number) => {
    const item = OWNER_BOTTOM_NAV_ITEMS[index];
    router.push(item.href);
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar + 1,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <BottomNavigation
        className="kh-bottom-tab-bar"
        value={activeIndex >= 0 ? activeIndex : false}
        onChange={(_, newValue) => handleNav(newValue)}
        showLabels
        component="nav"
        aria-label="Navigation propriétaire"
        sx={{
          ...bottomNavigationPwaShellSx(),
          boxShadow: 'none',
          borderRadius: 0,
        }}
      >
        {OWNER_BOTTOM_NAV_ITEMS.map((item, idx) => (
          <BottomNavigationAction
            key={item.href}
            label={item.label}
            icon={
              item.href === '/owner/dashboard' ? (
                <OwnerBottomNavDashboardIcon selected={idx === activeIndex} />
              ) : (
                item.icon
              )
            }
            aria-label={item.label}
            aria-current={idx === activeIndex ? 'page' : undefined}
            sx={
              item.href === '/owner/ads'
                ? {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.75rem',
                    },
                    '&.Mui-selected .MuiSvgIcon-root': {
                      color: 'primary.main',
                    },
                  }
                : undefined
            }
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
