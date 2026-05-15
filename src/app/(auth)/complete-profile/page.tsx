'use client';

import FadeIn from '@/components/ui/FadeIn';
import PhoneField from '@/components/ui/PhoneField';
import WelcomeOverlay from '@/components/ui/WelcomeOverlay';
import { buildClerkSignUpPatch } from '@/lib/clerk-signup-safe-update';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { getRegisterThemeTokens } from '@/lib/register-theme';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { citiesService } from '@/services/cities.service';
import { gradient } from '@/theme/tokens';
import { City, User } from '@/types';
import { useSignUp } from '@clerk/nextjs';
import ArrowBack from '@mui/icons-material/ArrowBack';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function formatClerkSignUpError(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const m = raw.toLowerCase();
  if (m.includes('legal') || m.includes('terms') || m.includes('conditions')) {
    return "Vous devez accepter les conditions d'utilisation pour continuer.";
  }
  if (m.includes('last name') || m.includes('last_name') || m.includes('nom')) {
    return 'Le nom est obligatoire pour finaliser la création du compte.';
  }

  return 'Une erreur est survenue. Veuillez réessayer ou contacter le support KeyHome.';
}

/**
 * Shown when a new OAuth user (Google, etc.) has missing required fields.
 *
 * Two flows:
 * 1. OTP flow (Clerk exchange → profile_required): reads `clerk_auth_prefill` from
 *    sessionStorage and calls our Laravel API to create the account.
 * 2. Clerk native sign-up with missing fields: calls Clerk's `signUp.update()`.
 */
export default function CompleteProfilePage() {
  const { finalizeAuth, getClerkToken } = useAuth();
  const {
    slotProps: citySlotProps,
    renderOption: renderCityOption,
    inputSx: cityInputSx,
  } = useCityAutocompleteConfig();
  const { signUp, setActive } = useSignUp();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  /** Clerk may require last name; never sent from phone field — OAuth prefill or this input */
  const [clerkLastName, setClerkLastName] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityInput, setCityInput] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Cities autocomplete — server-side search
  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['complete-profile-cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const cities = citiesData?.data || [];

  // Detect which flow we're in
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Stashed so the skip handler can call finalizeAuth without a stale closure. */
  const completeResultRef = useRef<{
    token: string;
    user: User;
    panel_sso_url: string | null;
  } | null>(null);

  // Cleanup welcome timer on unmount
  useEffect(() => {
    return () => {
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
    };
  }, []);

  const [isOtpFlow, setIsOtpFlow] = useState(false);
  const [prefill, setPrefill] = useState<{
    firstname: string;
    lastname?: string;
    email: string | null;
    avatar: string | null;
    registration_intent?: string;
  } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('clerk_auth_prefill');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setPrefill(parsed);
        setIsOtpFlow(true);
        if (parsed.registration_intent) {
          sessionStorage.setItem(
            'kh_registration_intent',
            parsed.registration_intent
          );
        }
      } catch {
        // malformed — fall through to Clerk native flow
      }
    }
  }, []);

  // ── Skip: complete without phone (both OTP and Clerk native flows) ──────────────────

  const handleSkip = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      if (isOtpFlow) {
        const result = await authService.completeClerkProfile({});
        sessionStorage.removeItem('clerk_auth_prefill');
        finalizeAuth(result.token, result.user, result.panel_sso_url);
      } else if (signUp) {
        const { patch } = buildClerkSignUpPatch(signUp, { prefill });
        const result = await signUp.update(
          Object.keys(patch).length > 0 ? patch : {}
        );
        if (result.status === 'complete') {
          await setActive!({ session: result.createdSessionId! });
          const laravel = await authService.completeClerkProfile({});
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('kh_registration_intent');
          }
          finalizeAuth(
            laravel.token,
            laravel.user,
            laravel.panel_sso_url ?? null
          );
        } else {
          const missing = result.missingFields?.join(', ') || '';
          setError(
            missing.length > 0
              ? `Cette étape ne peut pas être ignorée tant que ces champs sont requis : ${missing}.`
              : 'Impossible de passer cette étape pour le moment. Réessayez.'
          );
        }
      }
    } catch (err) {
      setError(
        getSafeErrorMessage(
          err,
          isOtpFlow
            ? 'Une erreur est survenue. Veuillez réessayer.'
            : formatClerkSignUpError(err)
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── OTP flow: create Laravel account ─────────────────────────────────────────────

  const handleOtpFlowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await authService.completeClerkProfile({
        phone_number: phoneNumber,
        ...(selectedCity ? { city_id: selectedCity.id } : {}),
      });
      sessionStorage.removeItem('clerk_auth_prefill');
      completeResultRef.current = result;
      setShowWelcome(true);
      welcomeTimerRef.current = setTimeout(() => {
        finalizeAuth(result.token, result.user, result.panel_sso_url);
      }, 3800);
    } catch (err) {
      setError(
        getSafeErrorMessage(err, 'Une erreur est survenue. Veuillez réessayer.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Clerk native sign-up flow ─────────────────────────────────────────────────────

  const handleClerkFlowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const { patch, blockedByPhoneOnly } = buildClerkSignUpPatch(signUp, {
        prefill,
        extraLastName: clerkLastName,
      });

      if (
        blockedByPhoneOnly &&
        Object.keys(patch).length === 0 &&
        (signUp.missingFields?.length ?? 0) > 0
      ) {
        setError(
          'Impossible de finaliser votre inscription pour le moment. Réessayez plus tard ou contactez le support KeyHome.'
        );
        setIsSubmitting(false);
        return;
      }

      const result = await signUp.update(
        Object.keys(patch).length > 0 ? patch : {}
      );

      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId! });
        const jwt = await getClerkToken();
        if (!jwt) {
          setError(
            'Session interrompue après la validation. Rechargez la page et réessayez.'
          );
          setIsSubmitting(false);
          return;
        }

        const laravel = await authService.completeClerkProfile({
          ...(phoneNumber.trim().length >= 8
            ? { phone_number: phoneNumber.trim() }
            : {}),
          ...(selectedCity ? { city_id: selectedCity.id } : {}),
        });

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('kh_registration_intent');
        }

        finalizeAuth(
          laravel.token,
          laravel.user,
          laravel.panel_sso_url ?? null
        );
      } else {
        const missing = result.missingFields?.join(', ') || 'inconnu';
        setError(
          `Champs encore requis côté connexion : ${missing}. Complétez le formulaire ou acceptez les conditions si proposé.`
        );
      }
    } catch (err: unknown) {
      setError(formatClerkSignUpError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsClerkLastName =
    !isOtpFlow &&
    !!signUp?.missingFields?.some((f) => /last[_]?name/i.test(String(f))) &&
    !(prefill?.lastname?.trim() || signUp?.lastName?.trim());

  // Not in an OTP flow and not in a Clerk sign-up flow — redirect to login
  if (!isOtpFlow && !signUp) {
    router.replace('/login');
    return null;
  }

  // Always show phone field — required by our backend for OTP flow, helpful for Clerk flow
  const showPhoneField = true;
  const otpPhoneBlocked =
    isOtpFlow && showPhoneField && phoneNumber.trim().length < 8;
  const clerkLastNameBlocked =
    !isOtpFlow && needsClerkLastName && clerkLastName.trim().length < 2;

  const handleSubmit = isOtpFlow ? handleOtpFlowSubmit : handleClerkFlowSubmit;

  if (showWelcome) {
    return (
      <WelcomeOverlay
        firstName={prefill?.firstname}
        onSkip={() => {
          if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
          const r = completeResultRef.current;
          if (r) finalizeAuth(r.token, r.user, r.panel_sso_url);
        }}
      />
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', minHeight: '100vh' }}>
      {/* Left side — image */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Image
          src="/images/04Final.webp"
          alt="Complétez votre profil KeyHome — plateforme immobilière en Afrique"
          fill
          priority
          sizes="50vw"
          style={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(34,34,34,0.15) 0%, rgba(34,34,34,0.6) 100%)',
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 6,
            zIndex: 2,
          }}
        >
          <FadeIn delay={0.2} direction="up">
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}
            >
              <Image
                src="/images/logo.png"
                alt="KeyHome — Compléter votre profil"
                width={42}
                height={42}
              />
              <Typography variant="h4" fontWeight={700} color="#fff">
                KeyHome
              </Typography>
            </Box>
          </FadeIn>
          <FadeIn delay={0.4} direction="up">
            <Typography
              variant="h5"
              color="rgba(255,255,255,0.9)"
              fontWeight={400}
              sx={{ maxWidth: 360 }}
            >
              Presque là !
            </Typography>
          </FadeIn>
        </Box>
      </Box>

      {/* Right side — form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 480px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6 },
          bgcolor: 'background.paper',
          position: 'relative',
        }}
      >
        {/* Back button */}
        <Box sx={{ position: 'absolute', top: 24, left: 24 }}>
          <IconButton
            onClick={() => router.replace('/login')}
            size="medium"
            aria-label="Retour"
            sx={{
              bgcolor: 'rgba(0,0,0,0.05)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
              borderRadius: 2,
            }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Mobile logo */}
        <FadeIn direction="none">
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1,
              mb: 4,
            }}
          >
            <Image
              src={
                prefill?.registration_intent === 'agent'
                  ? '/images/logo-teal.png'
                  : '/images/logo.png'
              }
              alt="KeyHome — Compléter votre profil"
              width={40}
              height={40}
              priority
            />
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                color:
                  prefill?.registration_intent === 'agent'
                    ? '#0d9488'
                    : 'primary.main',
              }}
            >
              KeyHome
            </Typography>
          </Box>
        </FadeIn>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <FadeIn delay={0.1} direction="up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {prefill?.registration_intent === 'agent'
                ? 'Configurez votre espace bailleur'
                : 'Complétez votre profil'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {prefill?.firstname
                ? prefill.registration_intent === 'agent'
                  ? `Bonjour ${prefill.firstname} ! Dernière étape avant de publier vos annonces.`
                  : `Bonjour ${prefill.firstname} ! Une dernière étape pour activer votre compte.`
                : 'Renseignez les informations manquantes pour continuer.'}
            </Typography>
          </FadeIn>

          {error && (
            <FadeIn direction="none" duration={0.3}>
              <Alert
                severity="error"
                id="complete-profile-error"
                sx={{ mb: 2, borderRadius: 2 }}
              >
                {error}
              </Alert>
            </FadeIn>
          )}

          <FadeIn delay={0.2} direction="up">
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {needsClerkLastName && (
                <TextField
                  label="Nom"
                  value={clerkLastName}
                  onChange={(e) => setClerkLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  inputProps={{ minLength: 2 }}
                />
              )}

              {showPhoneField && (
                <PhoneField
                  value={phoneNumber}
                  onChange={(val) => setPhoneNumber(val)}
                  label="Numéro de téléphone"
                  required={isOtpFlow}
                  helperText={
                    isOtpFlow
                      ? undefined
                      : 'Optionnel à cette étape — recommandé pour vous contacter.'
                  }
                />
              )}

              <Autocomplete
                open={cityDropdownOpen}
                onOpen={() => setCityDropdownOpen(true)}
                onClose={() => setCityDropdownOpen(false)}
                options={cities}
                getOptionLabel={(city) => city.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedCity}
                onChange={(_, newValue) => setSelectedCity(newValue)}
                inputValue={cityInput}
                onInputChange={(_, newInput) => setCityInput(newInput)}
                loading={isCitiesLoading}
                noOptionsText={
                  cityInput.length < 1
                    ? 'Tapez pour rechercher...'
                    : 'Aucune ville trouvée'
                }
                slotProps={citySlotProps}
                renderOption={(props, option) =>
                  renderCityOption(props, option)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Ville (optionnel)"
                    placeholder="Ex : Douala, Yaoundé…"
                    sx={cityInputSx}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isCitiesLoading ? (
                            <CircularProgress color="inherit" size={16} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={
                  isSubmitting || otpPhoneBlocked || clerkLastNameBlocked
                }
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background:
                    prefill?.registration_intent === 'agent'
                      ? getRegisterThemeTokens('agent').gradient
                      : gradient.primary,
                  '&:hover': {
                    background:
                      prefill?.registration_intent === 'agent'
                        ? getRegisterThemeTokens('agent').gradientHover
                        : gradient.primaryHover,
                  },
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: '#fff' }} />
                ) : (
                  'Continuer'
                )}
              </Button>

              {(isOtpFlow || !!signUp) && (
                <Button
                  type="button"
                  variant="text"
                  size="small"
                  fullWidth
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}
                >
                  Passer cette étape
                </Button>
              )}
            </Box>
          </FadeIn>
        </Box>
      </Box>
    </Box>
  );
}
