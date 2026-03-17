'use client';

import CreditsWidget from '@/components/layout/CreditsWidget';
import { BOTTOM_NAV_ITEMS } from '@/lib/nav-config';
import { useAuth } from '@/providers/AuthProvider';
import { useComparator } from '@/providers/ComparatorProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import {
  AddCircleOutline as AddCircleOutlineIcon,
  BarChart as BarChartIcon,
  CalendarMonth as CalendarMonthIcon,
  CompareArrows as CompareArrowsIcon,
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  Explore as ExploreIcon,
  Facebook as FacebookIcon,
  HelpOutline as HelpOutlineIcon,
  Instagram as InstagramIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { X as XIcon } from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Link,
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
  { label: 'Rechercher', href: '/search', icon: <SearchIcon /> },
  { label: 'Explorer la carte', href: '/nearby', icon: <ExploreIcon /> },
  { label: 'Comparaisons', href: '/comparaisons', icon: <CompareArrowsIcon /> },
  { label: 'Prix du marché', href: '/prix-marche', icon: <BarChartIcon /> },
  { label: 'Aide', href: '/aide', icon: <HelpOutlineIcon /> },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { items: comparatorItems } = useComparator();
  const { mode, toggleTheme } = useThemeMode();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isStandalone = useIsStandalone();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          // Glass effect is applied via MuiAppBar theme override
          // mode-aware colors are handled in theme.ts
          color: 'text.primary',
          top: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.drawer + 10,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            maxWidth: 1760,
            width: '100%',
            mx: 'auto',
            px: { xs: 1.5, md: 4 },
            minHeight: { xs: 56, md: 64 },
            display: 'grid',
            // Mobile: 3 equal columns — hamburger | logo | actions
            // Desktop: auto nav | logo | auto actions
            gridTemplateColumns: {
              xs: '1fr auto 1fr',
              md: '1fr auto 1fr',
            },
            alignItems: 'center',
          }}
        >
          {/* LEFT — nav links (desktop only, mobile uses BottomNav) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {!isMobile &&
              NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href || pathname?.startsWith(link.href + '/');
                const showBadge = link.href === '/comparaisons' && comparatorItems.length > 0;
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
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {link.label}
                      {showBadge && (
                        <Box
                          component="span"
                          sx={{
                            minWidth: 18,
                            height: 18,
                            px: 0.5,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {comparatorItems.length}
                        </Box>
                      )}
                    </Box>
                  </Button>
                );
              })}
          </Box>

          {/* CENTER — Logo (absolutely centered in grid) */}
          <Box
            onClick={() => router.push('/home')}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              flexShrink: 0,
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 0.85 },
            }}
          >
            <Image
              src="/images/logo.png"
              alt="KeyHome — Accueil"
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
                // Show "KeyHome" text on mobile too (just smaller)
                display: 'block',
              }}
            >
              KeyHome
            </Typography>
          </Box>

          {/* RIGHT — theme switcher + user actions */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: { xs: 0.5, md: 1 },
            }}
          >

            {isAuthenticated ? (
              <>
                {/* Publish CTA for agents */}
                {(user?.role === 'agent' || user?.role === 'admin') && !isMobile && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => router.push('/publish')}
                    sx={{ borderRadius: 99, fontWeight: 600, mr: 0.5 }}
                  >
                    Publier
                  </Button>
                )}
                <CreditsWidget />

                {/* Mobile: avatar opens the drawer for account actions */}
                {isMobile && (
                  <IconButton
                    aria-label="Menu compte"
                    onClick={() => setMobileOpen(true)}
                    size="small"
                    sx={{ ml: 0.5 }}
                  >
                    <Avatar
                      src={user?.avatar || undefined}
                      sx={{ width: 30, height: 30, bgcolor: 'text.secondary' }}
                    >
                      {user?.firstname?.[0] || 'U'}
                    </Avatar>
                  </IconButton>
                )}

                {/* Avatar menu — desktop only */}
                {!isMobile && (
                  <>
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
                        sx={{ width: 28, height: 28, bgcolor: 'text.secondary' }}
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
                      <MenuItem
                        onClick={() => {
                          setAnchorEl(null);
                          router.push('/my/reservations');
                        }}
                      >
                        <ListItemIcon>
                          <CalendarMonthIcon />
                        </ListItemIcon>
                        <ListItemText>Mes réservations</ListItemText>
                      </MenuItem>
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
                          router.push('/parametres');
                        }}
                      >
                        <ListItemIcon>
                          <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText>Paramètres</ListItemText>
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setAnchorEl(null);
                          setLogoutOpen(true);
                        }}
                      >
                        <ListItemIcon>
                          <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText>Déconnexion</ListItemText>
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Theme toggle for guests */}
                <IconButton
                  onClick={toggleTheme}
                  aria-label={mode === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                  size="small"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                  }}
                >
                  {mode === 'dark' ? (
                    <LightModeIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <DarkModeIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
                {/* On mobile: compact login icon */}
                {isMobile ? (
                  <IconButton
                    size="small"
                    onClick={() => router.push('/login')}
                    aria-label="Se connecter"
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '50%',
                      width: 34,
                      height: 34,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 18 }} />
                  </IconButton>
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
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      {/* Keep content from being hidden behind fixed navbar */}
      <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }} />

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: { xs: '85vw', sm: 300 }, maxWidth: 320, display: 'flex', flexDirection: 'column' } }}
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
              width={32}
              height={32}
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
        {/* Avatar en première position */}
        {user && (
          <>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar src={user.avatar || undefined} sx={{ width: 44, height: 44 }}>
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
        {/* Mobile browser (no BottomNav): Rechercher, Carte, Prix — sans Comparer ni Profil (déjà dans Compte) */}
        {isMobile && !isStandalone && (
          <>
            <List sx={{ px: 1, pt: 0 }}>
              {BOTTOM_NAV_ITEMS.filter((item) => item.href !== '/comparaisons' && item.href !== '/profile').map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <ListItem key={item.href} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setMobileOpen(false);
                        router.push(item.href);
                      }}
                      sx={{
                        borderRadius: 2,
                        mx: 1,
                        bgcolor: isActive ? 'rgba(246,71,95,0.08)' : 'transparent',
                        color: isActive ? 'primary.main' : 'text.primary',
                        '&:hover': { bgcolor: isActive ? 'rgba(246,71,95,0.12)' : 'action.hover' },
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            <Divider />
          </>
        )}
        <List sx={{ px: 1 }}>
          {/* Devenir hôte — mobile drawer */}
          <ListItem disablePadding>
            <ListItemButton
              component="a"
              href={process.env.NEXT_PUBLIC_OWNER_URL || '/owner'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              sx={{
                color: 'primary.main',
                borderRadius: 2,
                mx: 1,
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

          <Typography variant="overline" color="text.secondary" sx={{ px: 2, mb: 1, display: 'block', fontWeight: 700, letterSpacing: 1.2 }}>
            Compte
          </Typography>

          {isAuthenticated && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    setMobileOpen(false);
                    router.push('/comparaisons');
                  }}
                  sx={{ borderRadius: 2, mx: 1 }}
                >
                  <ListItemIcon>
                    <CompareArrowsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      comparatorItems.length > 0
                        ? `Comparaisons (${comparatorItems.length})`
                        : 'Comparaisons'
                    }
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    setMobileOpen(false);
                    router.push('/my/reservations');
                  }}
                  sx={{ borderRadius: 2, mx: 1 }}
                >
                  <ListItemIcon>
                    <CalendarMonthIcon />
                  </ListItemIcon>
                  <ListItemText primary="Mes réservations" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    setMobileOpen(false);
                    router.push('/profile');
                  }}
                  sx={{ borderRadius: 2, mx: 1 }}
                >
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="Mon profil" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    setMobileOpen(false);
                    router.push('/parametres');
                  }}
                  sx={{ borderRadius: 2, mx: 1 }}
                >
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
                    setMobileOpen(false);
                    setLogoutOpen(true);
                  }}
                  sx={{ borderRadius: 2, mx: 1, color: 'error.main' }}
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
                onClick={() => {
                  setMobileOpen(false);
                  router.push('/login');
                }}
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 600,
                  background: (theme) => theme.palette.gradient?.primary135 ?? 'linear-gradient(135deg, #F6475F, #D93A50)',
                }}
              >
                Se connecter
              </Button>
            </ListItem>
          )}
        </List>

        {/* Drawer footer */}
        <Box sx={{ mt: 'auto', borderTop: '1px solid', borderColor: 'divider', px: 2, py: 2, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 1 }}>
            {[
              { icon: <FacebookIcon sx={{ fontSize: 16 }} />, href: 'https://www.facebook.com/keyhomeapp', label: 'Facebook' },
              { icon: <XIcon sx={{ fontSize: 16 }} />, href: 'https://twitter.com/keyhome_app', label: 'X' },
              { icon: <InstagramIcon sx={{ fontSize: 16 }} />, href: 'https://www.instagram.com/keyhome_app', label: 'Instagram' },
            ].map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
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
                {social.icon}
              </Link>
            ))}
          </Box>
          <Link
            href="https://www.neocraft.dev"
            target="_blank"
            rel="noopener noreferrer"
            underline="none"
            sx={{ color: 'text.disabled', fontSize: '0.7rem', '&:hover': { color: 'text.secondary' } }}
          >
            Powered by <strong>NeoCraftTeam</strong>
          </Link>
        </Box>
      </Drawer>
      {/* Logout confirmation dialog */}
      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, px: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Se déconnecter ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr(e) de vouloir vous déconnecter de votre compte KeyHome ?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
          <Button
            onClick={() => setLogoutOpen(false)}
            variant="outlined"
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              setLogoutOpen(false);
              logout();
            }}
            variant="contained"
            color="error"
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600 }}
          >
            Déconnexion
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
