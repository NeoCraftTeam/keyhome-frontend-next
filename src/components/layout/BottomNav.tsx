'use client';

import { useAuth } from '@/providers/AuthProvider';
import {
  BarChart as BarChartIcon,
  Explore as ExploreIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Accueil', href: '/home', icon: <HomeIcon /> },
  { label: 'Rechercher', href: '/search', icon: <SearchIcon /> },
  { label: 'Carte', href: '/nearby', icon: <ExploreIcon /> },
  { label: 'Prix', href: '/prix-marche', icon: <BarChartIcon /> },
  { label: 'Profil', href: '/profile', icon: <PersonIcon /> },
];

export const BOTTOM_NAV_HEIGHT = 64;

export default function BottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (!isMobile) return null;

  const activeIndex = NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/'),
  );

  const handleNav = (index: number) => {
    const item = NAV_ITEMS[index];
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
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.65rem',
            fontWeight: 500,
            mt: 0.25,
            '&.Mui-selected': {
              fontSize: '0.65rem',
              fontWeight: 700,
            },
          },
        }}
      >
        {NAV_ITEMS.map((item) => (
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
