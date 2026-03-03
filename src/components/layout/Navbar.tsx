'use client';

import CreditsWidget from '@/components/layout/CreditsWidget';
import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import {
    Close as CloseIcon,
    DarkMode as DarkModeIcon,
    Explore as ExploreIcon,
    HelpOutline as HelpOutlineIcon,
    Home as HomeIcon,
    LightMode as LightModeIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Person as PersonIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
  { label: 'Accueil', href: '/home', icon: <HomeIcon /> },
  { label: 'Rechercher', href: '/search', icon: <SearchIcon /> },
  { label: 'Explorer la carte', href: '/nearby', icon: <ExploreIcon /> },
  { label: 'Aide', href: '/aide', icon: <HelpOutlineIcon /> },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 1760,
            width: '100%',
            mx: 'auto',
            px: { xs: 2, md: 4 },
            minHeight: { xs: 56, md: 64 },
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* LEFT — nav links desktop / hamburger mobile */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isMobile ? (
              <IconButton aria-label="Ouvrir le menu" onClick={() => setMobileOpen(true)}>
                <MenuIcon />
              </IconButton>
            ) : (
              NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                  <Button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.9rem',
                      color: isActive ? 'primary.main' : 'text.primary',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '8px',
                      position: 'relative',
                      whiteSpace: 'nowrap',
                      '&:hover': { bgcolor: 'action.hover' },
                      '&::after': isActive
                        ? {
                            content: '""',
                            position: 'absolute',
                            bottom: -2,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '60%',
                            height: 2,
                            bgcolor: 'primary.main',
                            borderRadius: 1,
                          }
                        : {},
                    }}
                  >
                    {link.label}
                  </Button>
                );
              })
            )}
          </Box>

          {/* CENTER — Logo */}
          <Box
            onClick={() => router.push('/home')}
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
              src="/images/logo.png"
              alt="KeyHome — Accueil"
              width={44}
              height={44}
              priority
              style={{ objectFit: 'contain' }}
            />
            <Typography
              variant="h6"
              sx={{
                color: 'primary.main',
                fontWeight: 800,
                fontSize: '1.2rem',
                letterSpacing: -0.5,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              KeyHome
            </Typography>
          </Box>

          {/* RIGHT — dark mode + credits + user menu */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 1,
            }}
          >
            <IconButton
              onClick={toggleTheme}
              size="small"
              aria-label={
                mode === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
              }
            >
              {mode === 'dark' ? (
                <LightModeIcon sx={{ fontSize: 20 }} />
              ) : (
                <DarkModeIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>

            {isAuthenticated ? (
              <>
                {!isMobile && <CreditsWidget />}

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
                  <MenuIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Avatar
                    src={user?.avatar || undefined}
                    sx={{ width: 30, height: 30, bgcolor: 'text.secondary' }}
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
                        minWidth: 220,
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
                  {NAV_LINKS.map((link) => (
                    <MenuItem
                      key={link.href}
                      onClick={() => {
                        setAnchorEl(null);
                        router.push(link.href);
                      }}
                    >
                      <ListItemIcon>{link.icon}</ListItemIcon>
                      <ListItemText>{link.label}</ListItemText>
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      router.push('/profile');
                    }}
                  >
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText>Mon profil</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      logout();
                    }}
                  >
                    <ListItemIcon>
                      <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText>Déconnexion</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={() => router.push('/login')}
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'divider',
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                }}
              >
                Se connecter
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
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
              width={28}
              height={28}
            />
            <Typography variant="h6" fontWeight={700} color="primary.main">
              KeyHome
            </Typography>
          </Box>
          <IconButton
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        {user && (
          <>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar src={user.avatar || undefined} sx={{ width: 40, height: 40 }}>
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
            <Box sx={{ px: 2, pb: 1 }}>
              <CreditsWidget />
            </Box>
            <Divider />
          </>
        )}
        <List>
          {NAV_LINKS.map((link) => (
            <ListItem key={link.href} disablePadding>
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  router.push(link.href);
                }}
              >
                <ListItemIcon>{link.icon}</ListItemIcon>
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
          {isAuthenticated && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    setMobileOpen(false);
                    router.push('/profile');
                  }}
                >
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="Mon profil" />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Déconnexion" />
                </ListItemButton>
              </ListItem>
            </>
          )}
          {!isAuthenticated && (
            <ListItem sx={{ pt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  setMobileOpen(false);
                  router.push('/login');
                }}
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Se connecter
              </Button>
            </ListItem>
          )}
        </List>
      </Drawer>
    </>
  );
}
