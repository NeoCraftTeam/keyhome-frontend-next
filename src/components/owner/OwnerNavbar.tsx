'use client';

import OwnerNotificationBell from '@/components/owner/OwnerNotificationBell';
import { SIDEBAR_WIDTH } from '@/components/owner/owner-constants';
import { OWNER_BOTTOM_NAV_ITEMS, OWNER_NAV_ITEMS } from '@/lib/nav-config';
import { useAuth } from '@/providers/AuthProvider';
import {
  AddCircleOutline as AddCircleOutlineIcon,
  ExpandMore as ExpandMoreIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const bottomHrefSet = new Set(OWNER_BOTTOM_NAV_ITEMS.map((i) => i.href));

export default function OwnerNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const moreNavItems = useMemo(
    () => OWNER_NAV_ITEMS.filter((item) => !bottomHrefSet.has(item.href)),
    [],
  );

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    router.replace('/owner/login');
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          color: 'text.primary',
          top: 0,
          left: 0,
          right: 0,
          pt: 'env(safe-area-inset-top, 0px)',
          zIndex: (theme) => theme.zIndex.drawer + 10,
          width: { xs: '100%', md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          ml: { md: SIDEBAR_WIDTH },
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            maxWidth: 1760,
            width: '100%',
            mx: 'auto',
            px: { xs: 1.5, md: 2 },
            minHeight: { xs: 56, md: 64 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Box
              onClick={() => router.push('/owner/dashboard')}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexShrink: 0,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 0.85 },
              }}
            >
              <Image
                src="/images/logo-teal.png"
                alt="KeyHome — Panneau propriétaire"
                width={isMobile ? 36 : 44}
                height={isMobile ? 36 : 44}
                priority
                style={{ objectFit: 'contain' }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: 'primary.main',
                  fontWeight: 800,
                  fontSize: { xs: '1.05rem', md: '1.2rem' },
                  letterSpacing: -0.5,
                  display: 'block',
                }}
              >
                KeyHome
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  ml: 0.5,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Propriétaire
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, flexShrink: 0 }}>
            {!isMobile && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => router.push('/owner/ads/new')}
                sx={{ borderRadius: 99, fontWeight: 600 }}
              >
                Nouvelle annonce
              </Button>
            )}
            <OwnerNotificationBell />
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '40px',
                px: 1.5,
                py: 0.5,
                cursor: 'pointer',
                '&:hover': { boxShadow: '0 2px 4px rgba(0,0,0,0.08)' },
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Avatar
                src={user?.avatar || undefined}
                sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}
              >
                {user?.firstname?.[0] || 'U'}
              </Avatar>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1.5,
                    minWidth: 240,
                    maxWidth: 320,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {user?.firstname} {user?.lastname}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              {isMobile && (
                <>
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      router.push('/owner/ads/new');
                    }}
                  >
                    <AddCircleOutlineIcon sx={{ mr: 1.5, fontSize: 22, color: 'primary.main' }} />
                    Nouvelle annonce
                  </MenuItem>
                  <Divider />
                </>
              )}
              {moreNavItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <MenuItem
                    key={item.href}
                    onClick={() => {
                      setAnchorEl(null);
                      router.push(item.href);
                    }}
                    selected={isActive}
                    sx={{ py: 1.25 }}
                  >
                    <Box sx={{ mr: 1.5, display: 'flex', color: isActive ? 'primary.main' : 'text.secondary' }}>
                      {item.icon}
                    </Box>
                    {item.label}
                  </MenuItem>
                );
              })}
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1.5, fontSize: 22 }} />
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Toolbar
        sx={{
          minHeight: {
            xs: 'calc(56px + env(safe-area-inset-top, 0px))',
            md: 'calc(64px + env(safe-area-inset-top, 0px))',
          },
        }}
      />
    </>
  );
}
