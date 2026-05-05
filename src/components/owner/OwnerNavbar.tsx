'use client';

import { ChatBadgeIcon } from '@/components/chat/ChatBadgeIcon';
import { SIDEBAR_WIDTH } from '@/components/owner/owner-constants';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { OWNER_BOTTOM_NAV_ITEMS, OWNER_NAV_ITEMS } from '@/lib/nav-config';
import {
  khNavbarSpacerMinHeightXs,
  khSafeAreaTopSx,
} from '@/lib/safe-area-insets';
import { useAuth } from '@/providers/AuthProvider';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
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
  const isStandalone = useIsStandalone();

  const moreNavItems = useMemo(
    () => OWNER_NAV_ITEMS.filter((item) => !bottomHrefSet.has(item.href)),
    []
  );

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout('/owner/login');
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          color: 'common.white',
          top: 0,
          left: 0,
          right: 0,
          pt: khSafeAreaTopSx,
          zIndex: (theme) => theme.zIndex.drawer + 10,
          width: { xs: '100%', md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          ml: { md: SIDEBAR_WIDTH },
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            maxWidth: 1760,
            width: '100%',
            mx: 'auto',
            px: { xs: 1, sm: 1.5, md: 2 },
            minHeight: { xs: 56, md: 64 },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              flex: '1 1 auto',
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box
              onClick={() => router.push('/owner/dashboard')}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.75, sm: 1 },
                minWidth: 0,
                maxWidth: '100%',
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
                style={{ objectFit: 'contain', flexShrink: 0 }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <Typography
                  variant="h6"
                  noWrap
                  sx={{
                    color: 'inherit',
                    fontWeight: 800,
                    fontSize: { xs: '1rem', sm: '1.05rem', md: '1.2rem' },
                    letterSpacing: -0.5,
                  }}
                >
                  KeyHome
                </Typography>
                <Chip
                  label="Propriétaire"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    bgcolor: 'rgba(255,255,255,0.18)',
                    color: '#fff',
                    border: 'none',
                    display: { xs: 'none', sm: 'flex' },
                    flexShrink: 0,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, sm: 0.75 },
              flexShrink: 0,
            }}
          >
            <Tooltip title="Nouvelle annonce">
              <IconButton
                aria-label="Nouvelle annonce"
                onClick={() => router.push('/owner/ads/new')}
                sx={{
                  width: 44,
                  height: 44,
                  color: 'common.white',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>
            {!(isMobile && isStandalone) && (
              <IconButton
                aria-label="Messagerie"
                onClick={() => router.push('/owner/messages')}
                sx={{
                  width: 44,
                  height: 44,
                  color: 'common.white',
                  border: '1px solid rgba(255,255,255,0.38)',
                  borderRadius: '50%',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                  '& .MuiSvgIcon-root': { color: 'inherit' },
                }}
              >
                <ChatBadgeIcon badgeColor="primary" />
              </IconButton>
            )}
            <Box
              role="button"
              tabIndex={0}
              aria-label="Menu utilisateur"
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl)}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setAnchorEl(e.currentTarget);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                border: '1px solid',
                borderColor: 'rgba(255,255,255,0.3)',
                borderRadius: '40px',
                px: 1.5,
                py: 0.5,
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  bgcolor: 'rgba(255,255,255,0.08)',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'rgba(255,255,255,0.6)',
                  outlineOffset: 2,
                },
              }}
            >
              <ExpandMoreIcon
                sx={{ fontSize: 18, color: 'rgba(255,255,255,0.75)' }}
              />
              <Avatar
                src={user?.avatar || undefined}
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: user?.avatar ? undefined : 'rgba(255,255,255,0.22)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {user?.firstname?.[0]?.toUpperCase() || 'U'}
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
              {isMobile
                ? [
                    <MenuItem
                      key="owner-nav-new-ad"
                      onClick={() => {
                        setAnchorEl(null);
                        router.push('/owner/ads/new');
                      }}
                    >
                      <AddCircleOutlineIcon
                        sx={{ mr: 1.5, fontSize: 22, color: 'primary.main' }}
                      />
                      Nouvelle annonce
                    </MenuItem>,
                    <Divider key="owner-nav-divider-mobile" />,
                  ]
                : null}
              {moreNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + '/');
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
                    <Box
                      sx={{
                        mr: 1.5,
                        display: 'flex',
                        color: isActive ? 'primary.main' : 'text.secondary',
                      }}
                    >
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
          display: { xs: 'flex', md: 'none' },
          minHeight: {
            xs: khNavbarSpacerMinHeightXs,
            md: 0,
          },
        }}
      />
    </>
  );
}
