'use client';

import { SIDEBAR_WIDTH } from '@/components/owner/owner-constants';
import { OWNER_NAV_ITEMS } from '@/lib/nav-config';
import {
  khLeftRailPaddingSx,
  khNavbarSpacerMinHeightXs,
  khSafeAreaBottomSx,
  khSafeAreaTopSx,
} from '@/lib/safe-area-insets';
import { useAuth } from '@/providers/AuthProvider';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OwnerNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout('/owner/login');
  };

  const go = (href: string) => {
    setDrawerOpen(false);
    router.push(href);
  };

  const isActive = (href: string) =>
    pathname === href || (pathname?.startsWith(href + '/') ?? false);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          top: 0,
          left: 0,
          right: 0,
          pt: khSafeAreaTopSx,
          zIndex: (t) => t.zIndex.appBar,
          width: { xs: '100%', md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          ml: { md: SIDEBAR_WIDTH },
          display: { xs: 'flex', md: 'none' },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            maxWidth: 1760,
            width: '100%',
            mx: 'auto',
            px: { xs: 1, sm: 1.5 },
            minHeight: { xs: 56, md: 64 },
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Left: avatar → opens navigation drawer */}
          <IconButton
            aria-label="Menu navigation"
            onClick={() => setDrawerOpen(true)}
            sx={{ width: 44, height: 44, flexShrink: 0 }}
          >
            <Avatar
              src={user?.avatar || undefined}
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {user?.firstname?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>

          {/* Center: teal logo + "KeyHome" */}
          <Box
            onClick={() => router.push('/owner/dashboard')}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <Image
              src="/images/logo-teal.png"
              alt="KeyHome — Panneau propriétaire"
              width={28}
              height={28}
              priority
              style={{ objectFit: 'contain', flexShrink: 0 }}
            />
            <Typography
              variant="h6"
              noWrap
              sx={{
                color: 'primary.main',
                fontWeight: 800,
                fontSize: { xs: '1rem', sm: '1.05rem' },
                letterSpacing: -0.5,
              }}
            >
              KeyHome
            </Typography>
          </Box>

          {/* Right: spacer keeps logo perfectly centered */}
          <Box sx={{ width: 44, height: 44, flexShrink: 0 }} />
        </Toolbar>
      </AppBar>

      {/* In-flow spacer so page content starts below the AppBar */}
      <Toolbar
        sx={{
          display: { xs: 'flex', md: 'none' },
          minHeight: { xs: khNavbarSpacerMinHeightXs, md: 0 },
        }}
      />

      {/* Slide-in navigation drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        transitionDuration={{ enter: 280, exit: 200 }}
        PaperProps={{
          sx: {
            width: { xs: '85vw', sm: 300 },
            maxWidth: 320,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            padding: khLeftRailPaddingSx,
            paddingBottom: khSafeAreaBottomSx,
            userSelect: 'none',
            WebkitUserSelect: 'none',
          },
        }}
      >
        {/* Drawer header */}
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
              src="/images/logo-teal.png"
              alt="KeyHome"
              width={32}
              height={32}
            />
            <Typography variant="h6" fontWeight={700} color="primary.main">
              KeyHome
            </Typography>
          </Box>
          <IconButton
            aria-label="Fermer le menu"
            onClick={() => setDrawerOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        {/* User info */}
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

        {/* Navigation items */}
        <List sx={{ px: 1, py: 0.5, flex: 1, overflowY: 'auto' }}>
          {OWNER_NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  onClick={() => go(item.href)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.25,
                    bgcolor: active ? 'rgba(20,184,166,0.08)' : 'transparent',
                    color: active ? 'primary.main' : 'text.primary',
                    '&:hover': {
                      bgcolor: active
                        ? 'rgba(20,184,166,0.12)'
                        : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: active ? 'primary.main' : 'text.secondary',
                      minWidth: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: active ? 600 : 500,
                          fontSize: '0.875rem',
                          lineHeight: 1.35,
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider />
        {/* Logout */}
        <Box sx={{ px: 1, pt: 0.5, pb: `max(12px, ${khSafeAreaBottomSx})` }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              color: 'primary.main',
              '&:hover': { bgcolor: 'rgba(20,184,166,0.08)' },
            }}
          >
            <ListItemIcon
              sx={{
                color: 'primary.main',
                minWidth: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Déconnexion"
              slotProps={{
                primary: { sx: { fontWeight: 500, fontSize: '0.875rem' } },
              }}
            />
          </ListItemButton>
        </Box>
      </Drawer>
    </>
  );
}
