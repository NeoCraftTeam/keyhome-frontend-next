'use client';

import { bottomNavigationPwaShellSx } from '@/components/layout/bottomNavigationPwaShellSx';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { BOTTOM_NAV_ITEMS } from '@/lib/nav-config';
import { NAV_LIST_ICON_GLYPH_PX } from '@/lib/navVisualMetrics';
import { PWA_BOTTOM_NAV_INNER_HEIGHT_PX } from '@/lib/pwaBottomNavConstants';
import { brand } from '@/theme/tokens';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';

/** @deprecated Prefer {@link PWA_BOTTOM_NAV_INNER_HEIGHT_PX} — kept for layout imports */
export const BOTTOM_NAV_HEIGHT = PWA_BOTTOM_NAV_INNER_HEIGHT_PX;

function ClientBottomNavHomeIcon({ selected }: { selected: boolean }) {
  return (
    <Box
      component="img"
      src="/images/logo.png"
      alt=""
      draggable={false}
      sx={{
        width: NAV_LIST_ICON_GLYPH_PX,
        height: NAV_LIST_ICON_GLYPH_PX,
        objectFit: 'contain',
        display: 'block',
        transition: 'opacity 0.2s ease, filter 0.2s ease',
        filter: selected ? 'none' : 'grayscale(1)',
        opacity: selected ? 1 : 0.42,
      }}
    />
  );
}

/** Bottom tab shell — visible only when the app runs as an installed / standalone surface. */
export default function BottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isStandalone = useIsStandalone();
  const pathname = usePathname();
  const router = useRouter();

  if (!isMobile || !isStandalone) {
    return null;
  }

  const activeIndex = BOTTOM_NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
  );

  const handleNav = (index: number) => {
    const item = BOTTOM_NAV_ITEMS[index];
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
        aria-label="Navigation principale"
        sx={{
          ...bottomNavigationPwaShellSx(),
          boxShadow: 'none',
          borderRadius: 0,
        }}
      >
        {BOTTOM_NAV_ITEMS.map((item, idx) => (
          <BottomNavigationAction
            key={item.href}
            label={item.label}
            icon={
              item.href === '/home' ? (
                <ClientBottomNavHomeIcon selected={idx === activeIndex} />
              ) : (
                item.icon
              )
            }
            aria-label={item.label}
            aria-current={idx === activeIndex ? 'page' : undefined}
            sx={
              item.href === '/home'
                ? {
                    '&.Mui-selected': {
                      color: `${brand.primary} !important`,
                      '&::after': {
                        bgcolor: `${brand.primary} !important`,
                      },
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
