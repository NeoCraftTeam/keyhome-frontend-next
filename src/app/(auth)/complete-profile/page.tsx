'use client';

import FadeIn from '@/components/ui/FadeIn';
import PhoneField from '@/components/ui/PhoneField';
import WelcomeOverlay from '@/components/ui/WelcomeOverlay';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { citiesService } from '@/services/cities.service';
import { City } from '@/types';
import { useSignUp } from '@clerk/nextjs';
import { ArrowBack } from '@mui/icons-material';
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
import { useEffect, useState } from 'react';
import { gradient } from '@/theme/tokens';

/**
 * Shown when a new OAuth user (Google, etc.) has missing required fields.
 *
 * Two flows:
 * 1. OTP flow (Clerk exchange → profile_required): reads `clerk_auth_prefill` from
 *    sessionStorage and calls our Laravel API to create the account.
 * 2. Clerk native sign-up with missing fields: calls Clerk's `signUp.update()`.
 */
export default function CompleteProfilePage() {
  const { finalizeAuth } = useAuth();
  const { slotProps: citySlotProps, renderOption: renderCityOption, inputSx: cityInputSx } = useCityAutocompleteConfig();
  const { signUp, setActive } = useSignUp();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
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
  const [isOtpFlow, setIsOtpFlow] = useState(false);
  const [prefill, setPrefill] = useState<{ firstname: string; lastname: string; email: string | null; avatar: string | null } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('clerk_auth_prefill');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setPrefill(parsed);
        setIsOtpFlow(true);
      } catch {
        // malformed — fall through to Clerk native flow
      }
    }
  }, []);

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
      setShowWelcome(true);
      setTimeout(() => {
        finalizeAuth(result.token, result.user, result.panel_sso_url);
      }, 3800);
    } catch (err) {
      setError(getSafeErrorMessage(err, 'Une erreur est survenue. Veuillez réessayer.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Clerk native sign-up flow ─────────────────────────────────────────────────────

  const handleClerkFlowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) { return; }

    setError('');
    setIsSubmitting(true);

    try {
      // Always attempt to pass phone_number — Clerk will ignore it if not required
      const updatePayload: Record<string, string> = {};
      if (phoneNumber.trim().length >= 8) {
        updatePayload.phoneNumber = phoneNumber;
      }

      const result = await signUp.update(updatePayload);

      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId! });
        router.replace('/home');
      } else {
        // Log missing fields to help debug future issues
        const missing = result.missingFields?.join(', ') || 'inconnu';
        setError(`Champs manquants : ${missing}. Veuillez compléter toutes les informations requises.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not in an OTP flow and not in a Clerk sign-up flow — redirect to login
  if (!isOtpFlow && !signUp) {
    router.replace('/login');
    return null;
  }

  // Always show phone field — required by our backend for OTP flow, helpful for Clerk flow
  const showPhoneField = true;
  const handleSubmit = isOtpFlow ? handleOtpFlowSubmit : handleClerkFlowSubmit;

  if (showWelcome) {
    return <WelcomeOverlay firstName={prefill?.firstname} />;
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
            background: 'linear-gradient(to bottom, rgba(34,34,34,0.15) 0%, rgba(34,34,34,0.6) 100%)',
            zIndex: 1,
          }}
        />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 6, zIndex: 2 }}>
          <FadeIn delay={0.2} direction="up">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Image src="/images/logo.png" alt="KeyHome — Compléter votre profil" width={42} height={42} />
              <Typography variant="h4" fontWeight={700} color="#fff">KeyHome</Typography>
            </Box>
          </FadeIn>
          <FadeIn delay={0.4} direction="up">
            <Typography variant="h5" color="rgba(255,255,255,0.9)" fontWeight={400} sx={{ maxWidth: 360 }}>
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
            onClick={() => router.back()}
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
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 4 }}>
            <Image src="/images/logo.png" alt="KeyHome — Compléter votre profil" width={40} height={40} priority />
            <Typography variant="h5" fontWeight={700} color="primary.main">KeyHome</Typography>
          </Box>
        </FadeIn>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <FadeIn delay={0.1} direction="up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Complétez votre profil
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {prefill?.firstname
                ? `Bonjour ${prefill.firstname} ! Une dernière étape pour activer votre compte.`
                : 'Renseignez les informations manquantes pour continuer.'}
            </Typography>
          </FadeIn>

          {error && (
            <FadeIn direction="none" duration={0.3}>
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
            </FadeIn>
          )}

          <FadeIn delay={0.2} direction="up">
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {showPhoneField && (
                <PhoneField
                  value={phoneNumber}
                  onChange={(val) => setPhoneNumber(val)}
                  label="Numéro de téléphone"
                  required
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
                noOptionsText={cityInput.length < 1 ? 'Tapez pour rechercher...' : 'Aucune ville trouvée'}
                slotProps={citySlotProps}
                renderOption={(props, option) => renderCityOption(props, option)}
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
                          {isCitiesLoading ? <CircularProgress color="inherit" size={16} /> : null}
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
                disabled={isSubmitting || (showPhoneField && phoneNumber.trim().length < 8)}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: gradient.primary,
                  '&:hover': { background: gradient.primaryHover },
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                {isSubmitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Continuer'}
              </Button>
            </Box>
          </FadeIn>
        </Box>
      </Box>
    </Box>
  );
}
