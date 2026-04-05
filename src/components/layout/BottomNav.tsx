'use client';

import { BOTTOM_NAV_ITEMS } from '@/lib/nav-config';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { useAuth } from '@/providers/AuthProvider';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';

export const BOTTOM_NAV_HEIGHT = 64;

export default function BottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isStandalone = useIsStandalone();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (!isMobile || !isStandalone) return null;

  const activeIndex = BOTTOM_NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
  );

  const handleNav = (index: number) => {
    const item = BOTTOM_NAV_ITEMS[index];
    if (item.href === '/profile' && !isAuthenticated) {
      router.push('/login');
      return;
    }
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
        // Safe area for iOS notch devices
        pb: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <BottomNavigation
        value={activeIndex >= 0 ? activeIndex : false}
        onChange={(_, newValue) => handleNav(newValue)}
        showLabels
        component="nav"
        aria-label="Navigation principale"
        sx={{
          height: BOTTOM_NAV_HEIGHT,
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
        {BOTTOM_NAV_ITEMS.map((item) => (
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
