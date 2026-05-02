'use client';

import CreditsWidget from '@/components/layout/CreditsWidget';
import NavDesktopMenu from '@/components/layout/NavDesktopMenu';
import NavDrawer from '@/components/layout/NavDrawer';
import NavLogoutDialog from '@/components/layout/NavLogoutDialog';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { useNavbarState } from '@/hooks/useNavbarState';
import { useAuth } from '@/providers/AuthProvider';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { ChatBadgeIcon } from '@/components/chat/ChatBadgeIcon';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BarChartIcon from '@mui/icons-material/BarChart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ExploreIcon from '@mui/icons-material/Explore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

const ROOT_PATHS = [
  '/home',
  '/search',
  '/nearby',
  '/comparaisons',
  '/prix-marche',
  '/aide',
  '/messages',
];

const NAV_LINKS = [
  { label: 'Rechercher', href: '/search', icon: <SearchIcon /> },
  { label: 'Explorer la carte', href: '/nearby', icon: <ExploreIcon /> },
  { label: 'Comparaisons', href: '/comparaisons', icon: <CompareArrowsIcon /> },
  { label: 'Estimer le loyer', href: '/prix-marche', icon: <BarChartIcon /> },
  { label: 'Aide', href: '/aide', icon: <HelpOutlineIcon /> },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isStandalone = useIsStandalone();
  const isRootPage = ROOT_PATHS.some((p) => pathname === p);
  /** PWA installée : avatar à gauche (drawer), solde à droite, style app native */
  const isClientPwaShell = isMobile && isStandalone && Boolean(isAuthenticated);

  const {
    anchorEl,
    mobileOpen,
    logoutOpen,
    comparatorCount,
    openDesktopMenu,
    closeDesktopMenu,
    openDrawer,
    closeDrawer,
    openLogout,
    closeLogout,
    isActive,
    showComparatorBadge,
  } = useNavbarState();

  const handleLogout = () => {
    closeLogout();
    logout();
  };

  return (
    <>
      {/* Skip-to-content link for keyboard/screen reader users (WCAG 2.4.1) */}
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'fixed',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: (t) => t.zIndex.tooltip + 1,
          bgcolor: 'primary.main',
          color: '#fff',
          px: 3,
          py: 1.5,
          borderRadius: '0 0 8px 8px',
          fontWeight: 600,
          fontSize: '0.875rem',
          textDecoration: 'none',
          transition: 'top 0.2s ease',
          '&:focus': {
            top: 0,
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        Aller au contenu principal
      </Box>

      <AppBar
        position="fixed"
        elevation={0}
        color="inherit"
        sx={{
          color: 'text.primary',
          top: 0,
          left: 0,
          right: 0,
          pt: 'env(safe-area-inset-top, 0px)',
          zIndex: (t) => t.zIndex.drawer + 10,
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
            gridTemplateColumns: { xs: '1fr auto 1fr', md: '1fr auto 1fr' },
            alignItems: 'center',
          }}
        >
          {/* LEFT — desktop nav / mobile retour + (PWA) avatar drawer */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isMobile && !isRootPage && (
              <IconButton
                size="small"
                onClick={() => router.back()}
                aria-label="Retour"
                sx={{ color: 'text.primary' }}
              >
                <ArrowBackIcon sx={{ fontSize: 22 }} />
              </IconButton>
            )}
            {isClientPwaShell && (
              <IconButton
                aria-label="Menu compte"
                onClick={openDrawer}
                sx={{ width: 44, height: 44, ml: !isRootPage ? 0 : -0.5 }}
              >
                <Avatar
                  src={user?.avatar || undefined}
                  sx={{ width: 32, height: 32, bgcolor: 'text.secondary' }}
                >
                  {user?.firstname?.[0] || 'U'}
                </Avatar>
              </IconButton>
            )}
            {!isMobile &&
              NAV_LINKS.map((link) => (
                <Button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  sx={{
                    textTransform: 'none',
                    fontWeight: isActive(link.href) ? 700 : 500,
                    fontSize: '0.9rem',
                    color: isActive(link.href)
                      ? 'primary.main'
                      : 'text.primary',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '8px',
                    position: 'relative',
                    whiteSpace: 'nowrap',
                    transition:
                      'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                    '@media (prefers-reduced-motion: reduce)': {
                      transition: 'background-color 0.2s ease, color 0.2s ease',
                      '&:hover': { transform: 'none', boxShadow: 'none' },
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    },
                    '&::after': isActive(link.href)
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
                          transition: 'width 0.2s ease, opacity 0.2s ease',
                        }
                      : {
                          content: '""',
                          position: 'absolute',
                          bottom: -2,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '0%',
                          height: 2,
                          bgcolor: 'primary.main',
                          borderRadius: 1,
                          opacity: 0,
                          transition: 'width 0.22s ease, opacity 0.22s ease',
                        },
                    '&:hover::after': isActive(link.href)
                      ? {}
                      : {
                          width: '45%',
                          opacity: 0.35,
                        },
                  }}
                >
                  <Box
                    component="span"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    {link.label}
                    {showComparatorBadge(link.href) && (
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
                        {comparatorCount}
                      </Box>
                    )}
                  </Box>
                </Button>
              ))}
          </Box>

          {/* CENTER — Logo */}
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
              variant="h1"
              sx={{
                color: 'primary.main',
                fontSize: { xs: '1.05rem', md: '1.2rem' },
                display: 'block',
              }}
            >
              KeyHome
            </Typography>
          </Box>

          {/* RIGHT — theme + user actions */}
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
                {(user?.role === 'agent' || user?.role === 'admin') &&
                  !isMobile && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={() => router.push('/publish')}
                      sx={{ borderRadius: 99, mr: 0.5 }}
                    >
                      Publier
                    </Button>
                  )}
                {(!isMobile || isClientPwaShell) && <CreditsWidget />}

                {/* Messages : masqué en PWA (onglet BottomNav). */}
                {!(isMobile && isStandalone) && (
                  <IconButton
                    aria-label="Messagerie"
                    onClick={() => router.push('/messages')}
                    sx={{ width: 40, height: 40 }}
                  >
                    <ChatBadgeIcon />
                  </IconButton>
                )}

                {isMobile ? (
                  isClientPwaShell ? null : (
                    <IconButton
                      aria-label="Menu compte"
                      onClick={openDrawer}
                      sx={{ ml: 0.5, width: 44, height: 44 }}
                    >
                      <Avatar
                        src={user?.avatar || undefined}
                        sx={{
                          width: 30,
                          height: 30,
                          bgcolor: 'text.secondary',
                        }}
                      >
                        {user?.firstname?.[0] || 'U'}
                      </Avatar>
                    </IconButton>
                  )
                ) : (
                  <>
                    <Box
                      onClick={openDesktopMenu}
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
                        minHeight: 44,
                        '&:hover': { boxShadow: '0 2px 4px rgba(0,0,0,0.08)' },
                        '&:active': { transform: 'scale(0.96)' },
                        transition: 'box-shadow 0.2s, transform 0.15s',
                      }}
                    >
                      <MenuIcon
                        sx={{
                          fontSize: 18,
                          color: 'text.secondary',
                          transform: anchorEl
                            ? 'rotate(90deg)'
                            : 'rotate(0deg)',
                          transition:
                            'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                      <Avatar
                        src={user?.avatar || undefined}
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: 'text.secondary',
                        }}
                      >
                        {user?.firstname?.[0] || 'U'}
                      </Avatar>
                    </Box>
                    <NavDesktopMenu
                      anchorEl={anchorEl}
                      onClose={closeDesktopMenu}
                      onNavigate={(href) => router.push(href)}
                      onLogoutClick={openLogout}
                      user={user}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                {isMobile ? (
                  <IconButton
                    onClick={() => router.push('/login')}
                    aria-label="Se connecter"
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '50%',
                      width: 44,
                      height: 44,
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
                      '&:hover': {
                        borderColor: 'primary.main',
                        color: 'primary.main',
                      },
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

      {/* Spacer — prevents content hiding under fixed navbar */}
      <Toolbar
        sx={{
          minHeight: {
            xs: 'calc(56px + env(safe-area-inset-top, 0px))',
            md: 'calc(64px + env(safe-area-inset-top, 0px))',
          },
        }}
      />

      <NavDrawer
        open={mobileOpen}
        onClose={closeDrawer}
        onNavigate={(href) => router.push(href)}
        onLogoutClick={openLogout}
        user={user}
        isAuthenticated={isAuthenticated}
        comparatorCount={comparatorCount}
        pathname={pathname}
        isStandalone={isStandalone}
      />

      <NavLogoutDialog
        open={logoutOpen}
        onClose={closeLogout}
        onConfirm={handleLogout}
      />
    </>
  );
}
