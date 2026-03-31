'use client';

import AuthFlowStepper from '@/components/auth/AuthFlowStepper';
import FadeIn from '@/components/ui/FadeIn';
import PhoneField from '@/components/ui/PhoneField';
import WelcomeOverlay from '@/components/ui/WelcomeOverlay';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { OWNER_LOGO_SRC } from '@/lib/owner-auth-assets';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { citiesService } from '@/services/cities.service';
import { brandAgent, shadow } from '@/theme/tokens';
import { City, UserRole } from '@/types';
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

export default function OwnerCompleteProfilePage() {
  const { finalizeAuth, user: authUser } = useAuth();
  const {
    slotProps: citySlotProps,
    renderOption: renderCityOption,
    inputSx: cityInputSx,
  } = useCityAutocompleteConfig();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityInput, setCityInput] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // If user is already fully authenticated and not an agent, redirect
    if (
      authUser &&
      authUser.role !== UserRole.AGENT &&
      authUser.role !== UserRole.ADMIN
    ) {
      router.replace('/home');
    }
  }, [authUser, router]);

  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['owner-complete-profile-cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const cities = citiesData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await authService.completeClerkProfile({
        phone_number: phoneNumber,
        ...(selectedCity ? { city_id: selectedCity.id } : {}),
      });

      setShowWelcome(true);
      // finalizeAuth handles routing: AGENT → /owner/dashboard
      setTimeout(() => {
        finalizeAuth(
          result.token,
          { ...result.user, role: UserRole.AGENT },
          result.panel_sso_url
        );
      }, 3800);
    } catch (err) {
      setError(
        getSafeErrorMessage(
          err,
          'Une erreur est survenue lors de la configuration de votre espace.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showWelcome) {
    return <WelcomeOverlay firstName={authUser?.firstname} isOwner />;
  }

  const buttonGradient = `linear-gradient(to right, ${brandAgent.primaryLight}, ${brandAgent.primary})`;
  const buttonGradientHover = `linear-gradient(to right, ${brandAgent.primary}, ${brandAgent.primaryDark})`;

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
          src="/images/owner/Real%20Estate%20Teal.webp"
          alt="Configuration Espace Bailleur KeyHome"
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
              'linear-gradient(to bottom, rgba(15,118,110,0.28) 0%, rgba(15,23,42,0.78) 100%)',
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
                src={OWNER_LOGO_SRC}
                alt="KeyHome Business"
                width={42}
                height={42}
              />
              <Typography variant="h4" fontWeight={700} color="#fff">
                KeyHome Business
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
              Configurez votre outil de gestion immobilière.
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
        <Box sx={{ position: 'absolute', top: 24, left: 24 }}>
          <IconButton
            onClick={() => router.back()}
            size="medium"
            sx={{ bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 2 }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Mobile logo — hidden on ≥ md where the hero image is shown */}
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
              src={OWNER_LOGO_SRC}
              alt="KeyHome Business"
              width={40}
              height={40}
              priority
            />
            <Typography
              variant="h5"
              fontWeight={700}
              color={brandAgent.primary}
            >
              KeyHome Business
            </Typography>
          </Box>
        </FadeIn>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <FadeIn delay={0.05} direction="none">
            <AuthFlowStepper
              labels={['Inscription', 'Vérification', 'Profil']}
              activeStep={2}
            />
          </FadeIn>

          <FadeIn delay={0.1} direction="up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Espace Professionnel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Dernière étape pour activer vos outils de gestion et commencer à
              publier.
            </Typography>
          </FadeIn>

          {error && (
            <FadeIn direction="none" duration={0.3}>
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                {error}
              </Alert>
            </FadeIn>
          )}

          <FadeIn delay={0.2} direction="up">
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
            >
              <PhoneField
                value={phoneNumber}
                onChange={(val) => setPhoneNumber(val)}
                label="Téléphone professionnel"
                required
              />

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
                    label="Ville d'opération"
                    placeholder="Ex : Douala, Yaoundé…"
                    sx={{
                      ...cityInputSx,
                      '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                    }}
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
                disabled={isSubmitting || phoneNumber.trim().length < 8}
                sx={{
                  py: 1.8,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '14px',
                  background: buttonGradient,
                  '&:hover': { background: buttonGradientHover },
                  boxShadow: shadow.agentGlow,
                  textTransform: 'none',
                  transition: 'all 0.2s',
                  '&:active': { transform: 'scale(0.98)' },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: '#fff' }} />
                ) : (
                  'Activer mon espace professionnel'
                )}
              </Button>
            </Box>
          </FadeIn>
        </Box>
      </Box>
    </Box>
  );
}
