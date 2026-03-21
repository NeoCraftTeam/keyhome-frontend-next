'use client';

import { OWNER_BOTTOM_NAV_ITEMS } from '@/lib/nav-config';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';

export const OWNER_BOTTOM_NAV_HEIGHT = 64;

export default function OwnerBottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const router = useRouter();

  /** Tous les mobiles (navigateur ou PWA standalone) : barre toujours visible pour l’espace bailleur. */
  if (!isMobile) {
    return null;
  }

  const activeIndex = OWNER_BOTTOM_NAV_ITEMS.findIndex(
    (item) =>
      pathname === item.href || pathname?.startsWith(item.href + '/'),
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
        zIndex: (theme) => theme.zIndex.appBar + 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <BottomNavigation
        value={activeIndex >= 0 ? activeIndex : false}
        onChange={(_, newValue) => handleNav(newValue)}
        showLabels
        component="nav"
        aria-label="Navigation propriétaire"
        sx={{
          height: OWNER_BOTTOM_NAV_HEIGHT,
          bgcolor: 'background.paper',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            py: 1,
            gap: 0.25,
            color: 'text.secondary',
            transition: 'all 0.2s ease',
            position: 'relative',
            '&:active': { transform: 'scale(0.92)' },
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.65rem',
            fontWeight: 500,
            mt: 0.25,
            transition: 'font-weight 0.2s ease',
            '&.Mui-selected': {
              fontSize: '0.65rem',
              fontWeight: 700,
            },
          },
          '& .Mui-selected': {
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 24,
              height: 3,
              borderRadius: '3px 3px 0 0',
              bgcolor: 'primary.main',
            },
          },
        }}
      >
        {OWNER_BOTTOM_NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.href}
            label={item.label}
            icon={item.icon}
            aria-label={item.label}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
