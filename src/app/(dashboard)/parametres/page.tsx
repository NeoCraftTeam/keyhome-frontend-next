'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { surveysService } from '@/services/surveys.service';
import { Survey } from '@/types';
import {
  Apple,
  ArrowForward as ArrowForwardIcon,
  Assignment as AssignmentIcon,
  ChevronLeft as ChevronLeftIcon,
  DarkMode as DarkModeIcon,
  Facebook,
  Google,
  LightMode as LightModeIcon,
  Link as LinkIcon,
  Logout as LogoutIcon,
  MonitorWeight as MonitorIcon,
  NotificationsNone as NotificationsIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  SettingsBrightness as SystemIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useClerk } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const BRAND = '#F6475F';

type ThemeChoice = 'light' | 'dark' | 'system';

export default function ParametresPage() {
  const { mode, toggleTheme } = useThemeMode();
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user: clerkUser } = useClerk();

  const [linkedAccountsLoading, setLinkedAccountsLoading] = useState<string | null>(null);
  const [linkedAccountsError, setLinkedAccountsError] = useState('');

  const { data: activeSurvey, isLoading: isSurveyLoading } = useQuery<Survey>({
    queryKey: ['active-survey'],
    queryFn: () => surveysService.getActive(),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  const { data: surveyAnsweredData } = useQuery({
    queryKey: ['survey-has-answered', activeSurvey?.id],
    queryFn: () => surveysService.hasAnswered(activeSurvey!.id),
    enabled: !!activeSurvey?.id,
    staleTime: 5 * 60 * 1000,
  });

  const surveyAnswered = surveyAnsweredData?.has_answered ?? false;

  const socialProviders = [
    { key: 'google', label: 'Google', icon: <Google sx={{ fontSize: 22 }} />, strategy: 'oauth_google' as const },
    { key: 'facebook', label: 'Facebook', icon: <Facebook sx={{ fontSize: 22 }} />, strategy: 'oauth_facebook' as const },
    { key: 'apple', label: 'Apple', icon: <Apple sx={{ fontSize: 22 }} />, strategy: 'oauth_apple' as const },
  ];

  const isProviderLinked = (strategy: string) => {
    if (!clerkUser) { return false; }
    return clerkUser.externalAccounts?.some((acc) => acc.provider === strategy) ?? false;
  };

  const getLinkedEmail = (strategy: string): string | null => {
    if (!clerkUser) { return null; }
    const acc = clerkUser.externalAccounts?.find((a) => a.provider === strategy);
    return acc?.emailAddress ?? null;
  };

  const handleConnectProvider = async (strategy: 'oauth_google' | 'oauth_facebook' | 'oauth_apple') => {
    if (!clerkUser) { return; }
    setLinkedAccountsLoading(strategy);
    setLinkedAccountsError('');
    try {
      await clerkUser.createExternalAccount({ strategy, redirectUrl: '/parametres' });
    } catch {
      setLinkedAccountsError(
        'La liaison de comptes sociaux nécessite une connexion via Google, Facebook ou Apple. ' +
        'Connectez-vous d\'abord avec un compte social, puis liez les autres ici.'
      );
    } finally {
      setLinkedAccountsLoading(null);
    }
  };

  const handleDisconnectProvider = async (strategy: 'oauth_google' | 'oauth_facebook' | 'oauth_apple') => {
    if (!clerkUser) { return; }
    setLinkedAccountsLoading(strategy);
    try {
      const acc = clerkUser.externalAccounts?.find((a) => (a.provider as string) === strategy);
      if (acc) { await acc.destroy(); }
    } catch {
      setLinkedAccountsError('Impossible de déconnecter ce compte pour le moment.');
    } finally {
      setLinkedAccountsLoading(null);
    }
  };

  const themeOptions: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Clair', icon: <LightModeIcon sx={{ fontSize: 20 }} /> },
    { value: 'dark', label: 'Sombre', icon: <DarkModeIcon sx={{ fontSize: 20 }} /> },
    { value: 'system', label: 'Système', icon: <SystemIcon sx={{ fontSize: 20 }} /> },
  ];

  const currentTheme: ThemeChoice = mode === 'dark' ? 'dark' : 'light';

  const sectionLabel = (label: string) => (
    <Typography
      variant="overline"
      sx={{
        color: 'text.secondary',
        fontSize: '0.7rem',
        letterSpacing: 1.2,
        fontWeight: 700,
        px: 0.5,
        mb: 0.5,
        display: 'block',
      }}
    >
      {label}
    </Typography>
  );

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <IconButton onClick={() => router.back()} size="small" sx={{ mr: 0.5 }}>
          <ChevronLeftIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2, letterSpacing: -0.5 }}>
            Paramètres
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Personnalisez votre expérience KeyHome
          </Typography>
        </Box>
      </Box>

      {/* ── Apparence ── */}
      <Box sx={{ mb: 3 }}>
        {sectionLabel('Apparence')}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: 'rgba(246,71,95,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {mode === 'dark' ? (
                  <DarkModeIcon sx={{ fontSize: 18, color: BRAND }} />
                ) : (
                  <LightModeIcon sx={{ fontSize: 18, color: BRAND }} />
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Thème
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Choisissez l&apos;apparence de l&apos;application
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {themeOptions.map((opt) => {
                const isActive =
                  opt.value === 'system'
                    ? false
                    : opt.value === currentTheme;
                return (
                  <Box
                    key={opt.value}
                    onClick={() => {
                      if (opt.value === 'system') { return; }
                      if (opt.value !== currentTheme) { toggleTheme(); }
                    }}
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                      py: 1.5,
                      px: 1,
                      borderRadius: 2,
                      border: '1.5px solid',
                      borderColor: isActive ? BRAND : 'divider',
                      bgcolor: isActive ? 'rgba(246,71,95,0.06)' : 'transparent',
                      cursor: opt.value === 'system' ? 'default' : 'pointer',
                      opacity: opt.value === 'system' ? 0.45 : 1,
                      transition: 'all 0.18s ease',
                      '&:hover': opt.value !== 'system' ? {
                        borderColor: BRAND,
                        bgcolor: 'rgba(246,71,95,0.04)',
                      } : {},
                    }}
                  >
                    <Box sx={{ color: isActive ? BRAND : 'text.secondary' }}>{opt.icon}</Box>
                    <Typography
                      variant="caption"
                      fontWeight={isActive ? 700 : 500}
                      sx={{ color: isActive ? BRAND : 'text.secondary' }}
                    >
                      {opt.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* ── Comptes liés ── */}
      {isAuthenticated && (
        <Box sx={{ mb: 3 }}>
          {sectionLabel('Comptes liés')}
          <Paper
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}
          >
            <Box sx={{ p: 2, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Box
                  sx={{
                    width: 36, height: 36, borderRadius: 2,
                    bgcolor: 'rgba(246,71,95,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <LinkIcon sx={{ fontSize: 18, color: BRAND }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Comptes sociaux</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Connectez-vous en un clic, sans mot de passe
                  </Typography>
                </Box>
              </Box>
            </Box>

            {linkedAccountsError && (
              <Alert severity="info" sx={{ mx: 2, mb: 1, borderRadius: 2, fontSize: '0.8rem' }}>
                {linkedAccountsError}
              </Alert>
            )}

            {socialProviders.map((provider, idx) => {
              const linked = isProviderLinked(provider.strategy);
              const linkedEmail = getLinkedEmail(provider.strategy);
              const isLoading = linkedAccountsLoading === provider.strategy;

              return (
                <Box key={provider.key}>
                  {idx > 0 && <Divider sx={{ mx: 2 }} />}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                      {provider.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {provider.label}
                      </Typography>
                      {linked ? (
                        <Typography variant="caption" color="success.main" noWrap>
                          {linkedEmail ?? 'Connecté'}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          Non connecté
                        </Typography>
                      )}
                    </Box>
                    {linked ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={isLoading}
                        onClick={() => handleDisconnectProvider(provider.strategy)}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', flexShrink: 0 }}
                      >
                        {isLoading ? '…' : 'Déconnecter'}
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={isLoading}
                        onClick={() => handleConnectProvider(provider.strategy)}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          flexShrink: 0,
                          borderColor: BRAND,
                          color: BRAND,
                          '&:hover': { bgcolor: 'rgba(246,71,95,0.06)', borderColor: BRAND },
                        }}
                      >
                        {isLoading ? '…' : 'Connecter'}
                      </Button>
                    )}
                  </Box>
                </Box>
              );
            })}
            <Box sx={{ pb: 1 }} />
          </Paper>
        </Box>
      )}

      {/* ── Sondage actif ── */}
      <Box sx={{ mb: 3 }}>
        {sectionLabel('Votre avis')}
        <Paper
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}
        >
          {isSurveyLoading ? (
            <Box sx={{ p: 2.5 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          ) : activeSurvey ? (
            <Box
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: surveyAnswered ? 'default' : 'pointer',
                transition: 'background 0.15s',
                '&:hover': surveyAnswered ? {} : { bgcolor: 'action.hover' },
              }}
              onClick={() => {
                if (!surveyAnswered) { router.push(`/sondage/${activeSurvey.id}`); }
              }}
            >
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: 2,
                  bgcolor: surveyAnswered ? 'rgba(0,138,5,0.1)' : 'rgba(246,71,95,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <AssignmentIcon sx={{ fontSize: 18, color: surveyAnswered ? 'success.main' : BRAND }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {activeSurvey.title}
                  </Typography>
                  {surveyAnswered && (
                    <Chip label="Complété" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {surveyAnswered ? 'Merci pour votre participation !' : 'Donnez votre avis — 2 min'}
                </Typography>
              </Box>
              {!surveyAnswered && (
                <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
              )}
            </Box>
          ) : (
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: 2,
                  bgcolor: 'action.hover',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <AssignmentIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Aucun sondage actif pour le moment
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* ── Préférences app ── */}
      <Box sx={{ mb: 3 }}>
        {sectionLabel('Préférences')}
        <Paper
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}
        >
          {[
            {
              icon: <NotificationsIcon sx={{ fontSize: 18, color: BRAND }} />,
              label: 'Notifications push',
              description: 'Nouvelles annonces et messages',
              defaultOn: true,
              disabled: true,
            },
            {
              icon: <MonitorIcon sx={{ fontSize: 18, color: BRAND }} />,
              label: 'Statistiques anonymes',
              description: "Aide à améliorer l'application",
              defaultOn: true,
              disabled: true,
            },
          ].map((pref, idx) => (
            <Box key={idx}>
              {idx > 0 && <Divider />}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.75 }}>
                <Box
                  sx={{
                    width: 36, height: 36, borderRadius: 2,
                    bgcolor: 'rgba(246,71,95,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  {pref.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{pref.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{pref.description}</Typography>
                </Box>
                <Switch
                  defaultChecked={pref.defaultOn}
                  disabled={pref.disabled}
                  size="small"
                  sx={{
                    '& .MuiSwitch-thumb': { bgcolor: BRAND },
                    '& .Mui-checked + .MuiSwitch-track': { bgcolor: `${BRAND} !important`, opacity: '0.5 !important' },
                  }}
                />
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>

      {/* ── Compte ── */}
      {isAuthenticated && (
        <Box sx={{ mb: 3 }}>
          {sectionLabel('Compte')}
          <Paper
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}
          >
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.75,
                cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => router.push('/profile')}
            >
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: 2,
                  bgcolor: 'rgba(246,71,95,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <PersonIcon sx={{ fontSize: 18, color: BRAND }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>Mon profil</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.firstname} {user?.lastname}
                </Typography>
              </Box>
              <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            </Box>
            <Divider />
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.75,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(211,47,47,0.04)' },
              }}
              onClick={() => logout()}
            >
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: 2,
                  bgcolor: 'rgba(211,47,47,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <LogoutIcon sx={{ fontSize: 18, color: 'error.main' }} />
              </Box>
              <Typography variant="body2" fontWeight={600} color="error.main">
                Déconnexion
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* ── À propos ── */}
      <Box sx={{ mb: 2 }}>
        {sectionLabel('À propos')}
        <Paper
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}
        >
          {[
            { label: 'Conditions d\'utilisation', href: '/conditions' },
            { label: 'Politique de confidentialité', href: '/confidentialite' },
            { label: 'Aide & FAQ', href: '/aide' },
            { label: 'Nous contacter', href: '/contact' },
          ].map((item, idx, arr) => (
            <Box key={item.href}>
              {idx > 0 && <Divider />}
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
                  cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => router.push(item.href)}
              >
                <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                  {item.label}
                </Typography>
                <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>

      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: 'block', textAlign: 'center', mt: 3, mb: 1 }}
      >
        KeyHome v1.0 — Propulsé par NeoCraftTeam
      </Typography>
    </Container>
  );
}
