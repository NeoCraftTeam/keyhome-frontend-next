'use client';

import { bottomNavigationPwaShellSx } from '@/components/layout/bottomNavigationPwaShellSx';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { OWNER_BOTTOM_NAV_ITEMS } from '@/lib/nav-config';
import { NAV_LIST_ICON_GLYPH_PX } from '@/lib/navVisualMetrics';
import { PWA_BOTTOM_NAV_INNER_HEIGHT_PX } from '@/lib/pwaBottomNavConstants';
import { ownerService } from '@/services/owner.service';
import { shadow } from '@/theme/tokens';
import {
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';

/** @deprecated Prefer {@link PWA_BOTTOM_NAV_INNER_HEIGHT_PX} — kept for owner layout FAB offset */
export const OWNER_BOTTOM_NAV_HEIGHT = PWA_BOTTOM_NAV_INNER_HEIGHT_PX;

function OwnerBottomNavDashboardIcon({ selected }: { selected: boolean }) {
  return (
    <Box
      component="img"
      src="/images/logo-teal.png"
      alt=""
      draggable={false}
      sx={{
        width: NAV_LIST_ICON_GLYPH_PX,
        height: NAV_LIST_ICON_GLYPH_PX,
        objectFit: 'contain',
        display: 'block',
        transition:
          'opacity 0.22s cubic-bezier(0.22, 1, 0.36, 1), filter 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
        filter: selected ? 'none' : 'grayscale(1)',
        opacity: selected ? 1 : 0.42,
      }}
    />
  );
}

/** Bailleur tabs — standalone PWA only (not mobile Safari/Chrome tabs). */
export default function OwnerBottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isStandalone = useIsStandalone();
  const pathname = usePathname();
  const router = useRouter();

  const shellActive = isMobile && isStandalone;

  const { data: pendingViewings } = useQuery({
    queryKey: ['owner', 'viewings', 'pending-count'],
    queryFn: ({ signal }) =>
      ownerService.getViewingReservations(
        { page: 1, status: 'pending' },
        { signal }
      ),
    select: (res) => res.meta?.total ?? 0,
    staleTime: 60_000,
    enabled: shellActive,
  });

  if (!shellActive) {
    return null;
  }

  const activeIndex = OWNER_BOTTOM_NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
  );

  const handleNav = (_: unknown, newValue: unknown) => {
    if (typeof newValue !== 'number' || newValue < 0) return;
    const item = OWNER_BOTTOM_NAV_ITEMS[newValue];
    if (!item?.href) return;
    try {
      router.push(item.href);
    } catch {
      window.location.assign(item.href);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar + 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        boxShadow: shadow.ownerElevatedRail,
      }}
    >
      <BottomNavigation
        className="kh-bottom-tab-bar"
        value={activeIndex >= 0 ? activeIndex : false}
        onChange={handleNav}
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
              ) : item.href === '/owner/viewings' ? (
                <Badge
                  badgeContent={
                    (pendingViewings ?? 0) > 0 ? pendingViewings : undefined
                  }
                  color="primary"
                  max={99}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.55rem',
                      height: 14,
                      minWidth: 14,
                    },
                  }}
                >
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )
            }
            aria-label={item.label}
            aria-current={idx === activeIndex ? 'page' : undefined}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
