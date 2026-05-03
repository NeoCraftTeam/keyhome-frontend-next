'use client';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import Toll from '@mui/icons-material/Toll';
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
import { AUTH_DRAWER_QUICK_NAV, SIDEBAR_NAV_ITEMS } from '@/lib/nav-config';
import {
  CLIENT_DRAWER_LIST_ICON_MIN_WIDTH_PX,
  NAV_LIST_ICON_GLYPH_PX,
} from '@/lib/navVisualMetrics';
import { type User } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { creditsService } from '@/services/credits.service';
import { brand } from '@/theme/tokens';

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

const ITEM_SX = {
  borderRadius: 2,
  mx: 1,
  minHeight: 48,
  '&:active': { bgcolor: 'rgba(246,71,95,0.08)' },
};

const DRAWER_ICON_SLOT_SX = {
  width: NAV_LIST_ICON_GLYPH_PX,
  height: NAV_LIST_ICON_GLYPH_PX,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& .MuiSvgIcon-root': { fontSize: NAV_LIST_ICON_GLYPH_PX },
} as const;

const ACCOUNT_LIST_ITEM_ICON_SX = {
  minWidth: CLIENT_DRAWER_LIST_ICON_MIN_WIDTH_PX,
  width: CLIENT_DRAWER_LIST_ICON_MIN_WIDTH_PX,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'text.secondary',
} as const;

const ACCOUNT_LIST_ITEM_TEXT_SLOT_PROPS = {
  primary: {
    sx: {
      fontWeight: 500,
      lineHeight: 1.35,
      fontSize: '0.875rem',
    },
  },
} as const;

/** Compact credit balance row for the mobile side drawer. */
function CreditsRow() {
  const { data: balance, isLoading } = useQuery({
    queryKey: ['credits-balance'],
    queryFn: () => creditsService.getBalance(),
    staleTime: 15_000,
    retry: false,
  });

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.6,
          background:
            'linear-gradient(135deg, rgba(246,71,95,0.12) 0%, rgba(246,71,95,0.06) 100%)',
          border: '1px solid',
          borderColor: 'rgba(246,71,95,0.25)',
          borderRadius: '40px',
          px: 1.5,
          py: 0.55,
        }}
      >
        <Toll sx={{ fontSize: 15, color: 'primary.main' }} />
        <Typography
          variant="body2"
          fontWeight={800}
          sx={{
            color: 'primary.main',
            lineHeight: 1,
            letterSpacing: -0.3,
            fontSize: '0.82rem',
          }}
        >
          {isLoading ? '…' : (balance ?? 0).toLocaleString('fr-FR')}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {(balance ?? 0) > 1 ? 'crédits' : 'crédit'}
      </Typography>
    </Box>
  );
}

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
    minWidth: CLIENT_DRAWER_LIST_ICON_MIN_WIDTH_PX,
    width: CLIENT_DRAWER_LIST_ICON_MIN_WIDTH_PX,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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

      {/* Crédits : dans la barre du haut en PWA standalone connecté */}
      {isAuthenticated && !isStandalone && <CreditsRow />}

      {/* Navigation principale — ordre type app native (connecté) */}
      {isAuthenticated && (
        <List sx={{ px: 1, py: 0.5 }}>
          {AUTH_DRAWER_QUICK_NAV.map((entry) => {
            const href = entry.href;
            const label =
              href === '/comparaisons' && comparatorCount > 0
                ? `Comparer (${comparatorCount})`
                : entry.label;

            return (
              <ListItem key={href} disablePadding>
                <ListItemButton onClick={() => go(href)} sx={activeSx(href)}>
                  <ListItemIcon sx={activeIconSx(href)}>
                    <Box sx={DRAWER_ICON_SLOT_SX}>{entry.icon}</Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: isActive(href) ? 600 : 500,
                          lineHeight: 1.35,
                          fontSize: '0.875rem',
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}

      {!isAuthenticated && (
        <>
          <List sx={{ px: 1, pt: 0 }}>
            {SIDEBAR_NAV_ITEMS.map((item) => (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  onClick={() => go(item.href)}
                  sx={activeSx(item.href)}
                >
                  <ListItemIcon sx={activeIconSx(item.href)}>
                    <Box sx={DRAWER_ICON_SLOT_SX}>{item.icon}</Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: isActive(item.href) ? 600 : 500,
                          lineHeight: 1.35,
                          fontSize: '0.875rem',
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
        </>
      )}

      {isAuthenticated && <Divider sx={{ my: 0.5 }} />}

      {/* Account links */}
      <List sx={{ px: 1 }}>
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
              <ListItemButton
                onClick={() => go('/my/reservations')}
                sx={ITEM_SX}
              >
                <ListItemIcon sx={ACCOUNT_LIST_ITEM_ICON_SX}>
                  <Box sx={DRAWER_ICON_SLOT_SX}>
                    <CalendarMonthIcon />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary="Mes réservations"
                  slotProps={ACCOUNT_LIST_ITEM_TEXT_SLOT_PROPS}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go('/notifications')} sx={ITEM_SX}>
                <ListItemIcon sx={ACCOUNT_LIST_ITEM_ICON_SX}>
                  <Box sx={DRAWER_ICON_SLOT_SX}>
                    <NotificationsIcon />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary="Notifications"
                  slotProps={ACCOUNT_LIST_ITEM_TEXT_SLOT_PROPS}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go('/search-alerts')} sx={ITEM_SX}>
                <ListItemIcon sx={ACCOUNT_LIST_ITEM_ICON_SX}>
                  <Box sx={DRAWER_ICON_SLOT_SX}>
                    <NotificationsActiveIcon />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary="Alertes de recherche"
                  slotProps={ACCOUNT_LIST_ITEM_TEXT_SLOT_PROPS}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go('/profile')} sx={ITEM_SX}>
                <ListItemIcon sx={ACCOUNT_LIST_ITEM_ICON_SX}>
                  <Box sx={DRAWER_ICON_SLOT_SX}>
                    <PersonIcon />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary="Mon profil"
                  slotProps={ACCOUNT_LIST_ITEM_TEXT_SLOT_PROPS}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go('/parametres')} sx={ITEM_SX}>
                <ListItemIcon sx={ACCOUNT_LIST_ITEM_ICON_SX}>
                  <Box sx={DRAWER_ICON_SLOT_SX}>
                    <SettingsIcon />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary="Paramètres"
                  slotProps={ACCOUNT_LIST_ITEM_TEXT_SLOT_PROPS}
                />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 1, mx: 2 }} />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  onClose();
                  onLogoutClick();
                }}
                sx={{ ...ITEM_SX, color: 'error.main' }}
              >
                <ListItemIcon
                  sx={{
                    ...ACCOUNT_LIST_ITEM_ICON_SX,
                    color: 'error.main',
                  }}
                >
                  <Box sx={DRAWER_ICON_SLOT_SX}>
                    <LogoutIcon color="error" />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary="Déconnexion"
                  slotProps={ACCOUNT_LIST_ITEM_TEXT_SLOT_PROPS}
                />
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
                  `linear-gradient(135deg, ${brand.primary}, #ff8c42)`,
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
