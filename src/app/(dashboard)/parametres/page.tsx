'use client';

import LinkedAccountsCard from '@/components/settings/LinkedAccountsCard';
import FadeIn from '@/components/ui/FadeIn';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { SOUND_ENABLED_KEY, useSoundFeedback } from '@/hooks/useSoundFeedback';
import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode, type ThemeChoice } from '@/providers/ThemeProvider';
import { surveysService } from '@/services/surveys.service';
import { brand } from '@/theme/tokens';
import { Survey } from '@/types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowIcon from '@mui/icons-material/ArrowForwardIos';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HelpIcon from '@mui/icons-material/HelpOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import SoundIcon from '@mui/icons-material/MusicNote';
import NotificationsIcon from '@mui/icons-material/NotificationsNone';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import {
  Avatar,
  Box,
  Chip,
  Container,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      sx={{
        color: 'text.secondary',
        fontSize: '0.72rem',
        letterSpacing: 0.8,
        fontWeight: 600,
        textTransform: 'uppercase',
        px: 1,
        mb: 1,
        display: 'block',
      }}
    >
      {children}
    </Typography>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      {children}
    </Box>
  );
}

function SettingsRow({
  icon,
  iconBg,
  label,
  sublabel,
  onClick,
  trailing,
  danger,
}: {
  icon: React.ReactNode;
  iconBg?: string;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.12s, transform 0.1s',
        '&:hover': onClick ? { bgcolor: 'action.hover' } : {},
        '&:active': onClick ? { transform: 'scale(0.99)' } : {},
        '&:not(:last-child)': {
          borderBottom: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Avatar
        sx={{
          width: 34,
          height: 34,
          bgcolor: danger
            ? 'rgba(211,47,47,0.08)'
            : (iconBg ?? brand.primaryAlpha10),
          color: danger ? 'error.main' : 'primary.main',
          fontSize: 18,
        }}
      >
        {icon}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          color={danger ? 'error.main' : 'text.primary'}
          noWrap
        >
          {label}
        </Typography>
        {sublabel && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {sublabel}
          </Typography>
        )}
      </Box>
      {trailing ??
        (onClick && (
          <ArrowIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        ))}
    </Box>
  );
}

export default function ParametresPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const { choice, setChoice } = useThemeMode();

  const { play } = useSoundFeedback();
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    try {
      const stored = localStorage.getItem(SOUND_ENABLED_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

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

  // Linked-accounts UI is now fully encapsulated in <LinkedAccountsCard />.

  return (
    <Container
      maxWidth={false}
      sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}
    >
      {/* Breadcrumb navigation */}
      <FadeIn>
        <PageBreadcrumbs
          items={[{ label: 'Accueil', href: '/home' }, { label: 'Paramètres' }]}
        />

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton
            onClick={() => router.back()}
            aria-label="Retour"
            size="small"
            sx={{ mr: 0.5, color: 'text.secondary' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              Paramètres
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Personnalisez votre experience
            </Typography>
          </Box>
        </Box>
      </FadeIn>

      {/* User card — full width */}
      {isAuthenticated && user && (
        <Box sx={{ mb: 3, maxWidth: { lg: 480 } }}>
          <SettingsCard>
            <Box
              onClick={() => router.push('/profile')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Avatar
                src={user.avatar || undefined}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'primary.main',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {user.firstname?.[0]}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {user.firstname} {user.lastname}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
              <ArrowIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            </Box>
          </SettingsCard>
        </Box>
      )}

      <Grid container spacing={3} alignItems="flex-start">
        {/* ── LEFT col: Apparence + Notifications + Logout ── */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <Box>
              <SectionTitle>Apparence</SectionTitle>
              <SettingsCard>
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start',
                  }}
                >
                  <Box sx={{ color: 'text.secondary', pt: 0.25 }}>
                    <SettingsBrightnessIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Thème
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Choisissez l&apos;affichage de l&apos;application. «
                      Système » suit le mode clair ou sombre de votre appareil.
                      La page d&apos;accueil marketing reste en thème sombre
                      dédié.
                    </Typography>
                    <ToggleButtonGroup
                      value={choice}
                      exclusive
                      onChange={(_e, v: ThemeChoice | null) => {
                        if (v != null) {
                          setChoice(v);
                        }
                      }}
                      aria-label="Choix du thème clair, sombre ou système"
                      fullWidth
                      size="small"
                      sx={{ mt: 1.5 }}
                    >
                      <ToggleButton value="light" sx={{ py: 1 }}>
                        Clair
                      </ToggleButton>
                      <ToggleButton value="dark" sx={{ py: 1 }}>
                        Sombre
                      </ToggleButton>
                      <ToggleButton value="system" sx={{ py: 1 }}>
                        Système
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Box>
              </SettingsCard>
            </Box>

            {/* Notifications */}
            <Box>
              <SectionTitle>Notifications</SectionTitle>
              <SettingsCard>
                <SettingsRow
                  icon={<NotificationsIcon sx={{ fontSize: 18 }} />}
                  label="Notifications push"
                  sublabel="Nouvelles annonces et messages"
                  trailing={
                    <Switch
                      defaultChecked
                      disabled
                      size="small"
                      sx={{
                        '& .MuiSwitch-thumb': { bgcolor: 'primary.main' },
                        '& .Mui-checked + .MuiSwitch-track': {
                          bgcolor: 'primary.main !important',
                          opacity: '0.5 !important',
                        },
                      }}
                    />
                  }
                />
                <SettingsRow
                  icon={<SoundIcon sx={{ fontSize: 18 }} />}
                  label="Sons de l'interface"
                  sublabel="Retours sonores discrets (favoris, actions)"
                  trailing={
                    <Switch
                      checked={soundEnabled}
                      size="small"
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setSoundEnabledState(enabled);
                        try {
                          localStorage.setItem(
                            SOUND_ENABLED_KEY,
                            String(enabled)
                          );
                        } catch {
                          /* ignore */
                        }
                        if (enabled) {
                          play('success');
                        }
                      }}
                      sx={{
                        '& .MuiSwitch-thumb': {
                          bgcolor: soundEnabled ? 'primary.main' : undefined,
                        },
                        '& .Mui-checked + .MuiSwitch-track': {
                          bgcolor: 'primary.main !important',
                          opacity: '0.5 !important',
                        },
                      }}
                    />
                  }
                />
              </SettingsCard>
            </Box>

            {/* Logout */}
            {isAuthenticated && (
              <Box>
                <SettingsCard>
                  <SettingsRow
                    icon={<LogoutIcon sx={{ fontSize: 18 }} />}
                    label="Deconnexion"
                    danger
                    onClick={() => logout()}
                  />
                </SettingsCard>
              </Box>
            )}
          </Stack>
        </Grid>
        {/* end left col */}

        {/* ── RIGHT col: Passkeys + Comptes liés + Votre avis + A propos ── */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={3}>
            {/* Linked accounts (self-contained: handles Clerk linking,
                redirect, error display) */}
            {isAuthenticated && (
              <LinkedAccountsCard redirectPath="/parametres" />
            )}

            {/* Survey */}
            <Box>
              <SectionTitle>Votre avis</SectionTitle>
              <SettingsCard>
                {isSurveyLoading ? (
                  <Box sx={{ p: 2 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                ) : activeSurvey ? (
                  <SettingsRow
                    icon={<AssignmentIcon sx={{ fontSize: 18 }} />}
                    iconBg={surveyAnswered ? 'rgba(46,125,50,0.08)' : undefined}
                    label={activeSurvey.title}
                    sublabel={
                      surveyAnswered
                        ? 'Merci pour votre participation !'
                        : '2 min — Donnez votre avis'
                    }
                    onClick={
                      surveyAnswered
                        ? undefined
                        : () => router.push(`/sondage/${activeSurvey.id}`)
                    }
                    trailing={
                      surveyAnswered ? (
                        <Chip
                          label="Fait"
                          size="small"
                          color="success"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        />
                      ) : undefined
                    }
                  />
                ) : (
                  <SettingsRow
                    icon={<AssignmentIcon sx={{ fontSize: 18 }} />}
                    iconBg="rgba(0,0,0,0.04)"
                    label="Aucun sondage actif"
                    sublabel="Revenez bientot"
                  />
                )}
              </SettingsCard>
            </Box>

            {/* About */}
            <Box>
              <SectionTitle>A propos</SectionTitle>
              <SettingsCard>
                {[
                  { label: 'Signaler un litige', href: '/litiges' },
                  { label: 'Mes remboursements', href: '/remboursements' },
                  { label: 'Aide & FAQ', href: '/aide' },
                  { label: "Conditions d'utilisation", href: '/conditions' },
                  { label: 'Confidentialite', href: '/confidentialite' },
                  { label: 'Nous contacter', href: '/contact' },
                ].map((item) => (
                  <SettingsRow
                    key={item.href}
                    icon={<HelpIcon sx={{ fontSize: 18 }} />}
                    iconBg="rgba(0,0,0,0.04)"
                    label={item.label}
                    onClick={() => router.push(item.href)}
                  />
                ))}
              </SettingsCard>
            </Box>
          </Stack>
        </Grid>
        {/* end right col */}
      </Grid>
      {/* end grid */}

      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: 'block', textAlign: 'center', mt: 2, mb: 1 }}
      >
        KeyHome v1.0 — Propulse par NeoCraftTeam
      </Typography>
    </Container>
  );
}
