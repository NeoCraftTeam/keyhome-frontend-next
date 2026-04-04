'use client';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import XIcon from '@mui/icons-material/X';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { SIDEBAR_NAV_ITEMS } from '@/lib/nav-config';
import type { User } from '@/types';
import { useThemeMode } from '@/providers/ThemeProvider';

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
  onLogoutClick: () => void;
  user: User | null;
  isAuthenticated: boolean;
  comparatorCount: number;
  pathname: string | null;
  isStandalone: boolean;
}

const SOCIAL_LINKS = [
  {
    icon: <FacebookIcon sx={{ fontSize: 16 }} />,
    href: 'https://www.facebook.com/keyhomeapp',
    label: 'Facebook',
  },
  {
    icon: <XIcon sx={{ fontSize: 16 }} />,
    href: 'https://twitter.com/keyhome_app',
    label: 'X',
  },
  {
    icon: <InstagramIcon sx={{ fontSize: 16 }} />,
    href: 'https://www.instagram.com/keyhome_app',
    label: 'Instagram',
  },
];

const ITEM_SX = { borderRadius: 2, mx: 1 };

export default function NavDrawer({
  open,
  onClose,
  onNavigate,
  onLogoutClick,
  user,
  isAuthenticated,
  comparatorCount,
  pathname,
  isStandalone,
}: NavDrawerProps) {
  const { mode, toggleTheme } = useThemeMode();

  const go = (href: string) => {
    onClose();
    onNavigate(href);
  };

  const isActive = (href: string) =>
    pathname === href || (pathname?.startsWith(href + '/') ?? false);

  const activeSx = (href: string) => ({
    ...ITEM_SX,
    bgcolor: isActive(href) ? 'rgba(246,71,95,0.08)' : 'transparent',
    color: isActive(href) ? 'primary.main' : 'text.primary',
    '&:hover': {
      bgcolor: isActive(href) ? 'rgba(246,71,95,0.12)' : 'action.hover',
    },
  });

  const activeIconSx = (href: string) => ({
    color: isActive(href) ? 'primary.main' : 'text.secondary',
    minWidth: 40,
  });

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      transitionDuration={{ enter: 280, exit: 200 }}
      PaperProps={{
        sx: {
          width: { xs: '85vw', sm: 300 },
          maxWidth: 320,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Image
            src="/images/logo.png"
            alt="KeyHome — Accueil"
            width={32}
            height={32}
          />
          <Typography variant="h6" fontWeight={700} color="primary.main">
            KeyHome
          </Typography>
        </Box>
        <IconButton aria-label="Fermer le menu" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      {/* Authenticated user info */}
      {user && (
        <>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={user.avatar || undefined}
              sx={{ width: 44, height: 44 }}
            >
              {user.firstname?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {user.firstname} {user.lastname}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Sidebar nav (mobile browser without BottomNav) */}
      {!isStandalone && (
        <>
          <List sx={{ px: 1, pt: 0 }}>
            {SIDEBAR_NAV_ITEMS.map((item) => (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  onClick={() => go(item.href)}
                  sx={activeSx(item.href)}
                >
                  <ListItemIcon sx={activeIconSx(item.href)}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
        </>
      )}

      {/* Account links */}
      <List sx={{ px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            component="a"
            href="/owner"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            sx={{
              color: 'primary.main',
              ...ITEM_SX,
              '&:hover': { bgcolor: 'rgba(246,71,95,0.06)' },
            }}
          >
            <ListItemIcon>
              <AddCircleOutlineIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Devenir hôte" />
          </ListItemButton>
        </ListItem>
        <Divider sx={{ my: 1.5, mx: 2 }} />

        <Typography
          variant="overline"
          color="text.secondary"
          sx={{
            px: 2,
            mb: 1,
            display: 'block',
            fontWeight: 700,
            letterSpacing: 1.2,
          }}
        >
          Compte
        </Typography>

        {isAuthenticated && (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go('/comparaisons')} sx={ITEM_SX}>
                <ListItemIcon>
                  <CompareArrowsIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    comparatorCount > 0
                      ? `Comparaisons (${comparatorCount})`
                      : 'Comparaisons'
                  }
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => go('/my/reservations')}
                sx={ITEM_SX}
              >
                <ListItemIcon>
                  <CalendarMonthIcon />
                </ListItemIcon>
                <ListItemText primary="Mes réservations" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go('/notifications')} sx={ITEM_SX}>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText primary="Notifications" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go('/search-alerts')} sx={ITEM_SX}>
                <ListItemIcon>
                  <NotificationsActiveIcon />
                </ListItemIcon>
                <ListItemText primary="Alertes de recherche" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go('/profile')} sx={ITEM_SX}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Mon profil" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go('/parametres')} sx={ITEM_SX}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Paramètres" />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 1, mx: 2 }} />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  toggleTheme();
                }}
                sx={ITEM_SX}
              >
                <ListItemIcon>
                  {mode === 'dark' ? (
                    <LightModeIcon sx={{ color: 'text.secondary' }} />
                  ) : (
                    <DarkModeIcon sx={{ color: 'text.secondary' }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={mode === 'dark' ? 'Mode clair' : 'Mode sombre'}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  onClose();
                  onLogoutClick();
                }}
                sx={{ ...ITEM_SX, color: 'error.main' }}
              >
                <ListItemIcon>
                  <LogoutIcon color="error" />
                </ListItemIcon>
                <ListItemText primary="Déconnexion" />
              </ListItemButton>
            </ListItem>
          </>
        )}

        {!isAuthenticated && (
          <ListItem sx={{ pt: 2, px: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => go('/login')}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                fontWeight: 600,
                background: (theme) =>
                  (theme.palette as { gradient?: { primary135?: string } })
                    .gradient?.primary135 ??
                  'linear-gradient(135deg, #F6475F, #ff8c42)',
              }}
            >
              Se connecter
            </Button>
          </ListItem>
        )}
      </List>

      {/* Footer */}
      <Box
        sx={{
          mt: 'auto',
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 2,
          py: 2,
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 1 }}>
          {SOCIAL_LINKS.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              underline="none"
              sx={{
                color: 'text.disabled',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                transition: 'color 0.2s',
                '&:hover': { color: 'text.secondary' },
              }}
            >
              {s.icon}
            </Link>
          ))}
        </Box>
        <Link
          href="https://www.neocraft.dev"
          target="_blank"
          rel="noopener noreferrer"
          underline="none"
          sx={{
            color: 'text.disabled',
            fontSize: '0.7rem',
            '&:hover': { color: 'text.secondary' },
          }}
        >
          Powered by <strong>NeoCraftTeam</strong>
        </Link>
      </Box>
    </Drawer>
  );
}
