'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Paper,
  InputBase,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Tune as TuneIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Explore as ExploreIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode } from '@/providers/ThemeProvider';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: 'Accueil', href: '/home', icon: <HomeIcon /> },
    { label: 'Explorer', href: '/nearby', icon: <ExploreIcon /> },
    { label: 'Rechercher', href: '/search', icon: <SearchIcon /> },
  ];

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
            py: 1,
            gap: 2,
          }}
        >
          {/* Logo */}
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
              alt="KeyHome"
              width={44}
              height={44}
              priority
              style={{ objectFit: 'contain' }}
            />
            {!isMobile && (
              <Typography
                variant="h6"
                sx={{
                  color: 'primary.main',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: -0.5,
                }}
              >
                KeyHome
              </Typography>
            )}
          </Box>

          {/* Search Bar — Airbnb style */}
          {isAuthenticated && (
            <Paper
              component="form"
              onSubmit={handleSearch}
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                flex: { xs: 1, md: '0 1 560px' },
                mx: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '40px',
                px: 2,
                py: 0.5,
                transition: 'box-shadow 0.2s',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                },
                '&:focus-within': {
                  boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                  borderColor: 'text.secondary',
                },
              }}
            >
              <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
              <InputBase
                placeholder="Rechercher une ville, un quartier, un type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  flex: 1,
                  fontSize: '0.875rem',
                  '& input::placeholder': { color: 'text.secondary' },
                }}
              />
              <IconButton
                size="small"
                onClick={() => router.push('/search')}
                sx={{
                  bgcolor: 'primary.main',
                  color: '#fff',
                  width: 32,
                  height: 32,
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <TuneIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Paper>
          )}

          {/* Right side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <IconButton onClick={toggleTheme} size="small">
              {mode === 'dark' ? (
                <LightModeIcon sx={{ fontSize: 20 }} />
              ) : (
                <DarkModeIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>

            {isAuthenticated ? (
              <>
                {isMobile ? (
                  <IconButton onClick={() => setMobileOpen(true)}>
                    <MenuIcon />
                  </IconButton>
                ) : (
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
                )}

                {/* Desktop dropdown */}
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
                  {navLinks.map((link) => (
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
            ) : null}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 280, borderRadius: '16px 0 0 16px' } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Image src="/images/logo.png" alt="KeyHome" width={28} height={28} />
            <Typography variant="h6" fontWeight={700} color="primary.main">
              KeyHome
            </Typography>
          </Box>
          <IconButton onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        {user && (
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
        )}
        <Divider />
        <List>
          {navLinks.map((link) => (
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
        </List>
      </Drawer>
    </>
  );
}
