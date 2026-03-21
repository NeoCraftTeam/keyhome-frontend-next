'use client';

import AuthFlowStepper from '@/components/auth/AuthFlowStepper';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import FadeIn from '@/components/ui/FadeIn';
import PhoneField from '@/components/ui/PhoneField';
import WelcomeOverlay from '@/components/ui/WelcomeOverlay';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { registerTokenGetter } from '@/lib/auth-token';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { useOutlinedInputLabelShrink } from '@/hooks/useOutlinedInputLabelShrink';
import {
  mergeOutlinedStartIconInputLabelProps,
  outlinedStartIconInputLabelProps,
} from '@/lib/mui-outlined-input-label-start-icon';
import { getRegisterThemeTokens, REGISTER_AGENT_HERO_SRC, type RegisterAccountVisual } from '@/lib/register-theme';
import { authService } from '@/services/auth.service';
import { citiesService } from '@/services/cities.service';
import { City } from '@/types';
import {
  Business as BusinessIcon,
  Check as CheckIcon,
  LocationCity as CityIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  PersonOutline,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FocusEvent, useEffect, useMemo, useState } from 'react';

type AccountRole = 'customer' | 'agent';
type AgentType = 'individual' | 'agency';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;

  if (score <= 25) return { score, label: 'Faible', color: '#d32f2f' };
  if (score <= 50) return { score, label: 'Moyen', color: '#ed6c02' };
  if (score <= 75) return { score, label: 'Bon', color: '#2e7d32' };
  return { score, label: 'Excellent', color: '#1b5e20' };
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slotProps: citySlotProps, renderOption: renderCityOption, inputSx: cityInputSx } = useCityAutocompleteConfig();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showWelcome, setShowWelcome] = useState(false);
  const [accountRole, setAccountRole] = useState<AccountRole>('customer');
  const [agentType, setAgentType] = useState<AgentType>('individual');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const role = searchParams.get('role');
    const intent = searchParams.get('intent');
    if (role === 'agent' || role === 'bailleur' || intent === 'owner') {
      setAccountRole('agent');
    }
  }, [searchParams]);

  const visual: RegisterAccountVisual = accountRole === 'agent' ? 'agent' : 'customer';
  const tokens = useMemo(() => getRegisterThemeTokens(visual), [visual]);

  const registerMuiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          primary: {
            main: tokens.primary,
            dark: tokens.primaryDark,
            light: tokens.primaryLight,
          },
        },
      }),
    [tokens.primary, tokens.primaryDark, tokens.primaryLight],
  );

  const registerActionRadius = '14px';

  const outlinedActionSx = useMemo(
    () => ({
      py: 1.5,
      fontWeight: 600,
      borderRadius: registerActionRadius,
      textTransform: 'none' as const,
      transition: 'border-color 0.35s ease, color 0.35s ease',
    }),
    [],
  );

  const containedGradientSx = useMemo(
    () => ({
      py: 1.5,
      fontWeight: 600,
      borderRadius: registerActionRadius,
      textTransform: 'none' as const,
      background: tokens.gradient,
      transition: 'background 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s ease, box-shadow 0.35s ease',
      '&:hover': { background: tokens.gradientHover },
      '&:active': { transform: 'scale(0.97)' },
    }),
    [tokens.gradient, tokens.gradientHover],
  );

  const loginHref = accountRole === 'agent' ? '/owner/login' : '/login';

  useEffect(() => {
    if (accountRole === 'agent' && agentType === 'agency') {
      setAgentType('individual');
    }
  }, [accountRole, agentType]);

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
  });

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityInput, setCityInput] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [cityLabelFocused, setCityLabelFocused] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const firstnameLabelShrink = useOutlinedInputLabelShrink(form.firstname.length > 0);
  const emailLabelShrink = useOutlinedInputLabelShrink(form.email.length > 0);
  const passwordLabelShrink = useOutlinedInputLabelShrink(form.password.length > 0);
  const confirmPasswordLabelShrink = useOutlinedInputLabelShrink(form.confirm_password.length > 0);

  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['register-cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const cities = citiesData?.data || [];

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isPhoneValid = /^\+?[0-9]{10,15}$/.test(form.phone_number.replace(/[\s\-]/g, ''));

  const canProceedStep1 =
    form.firstname.trim().length >= 2 &&
    form.lastname.trim().length >= 2 &&
    form.email.includes('@') &&
    isPhoneValid;

  const passwordStrength = getPasswordStrength(form.password);
  const canSubmit =
    form.password.length >= 8 &&
    form.password === form.confirm_password &&
    passwordStrength.score >= 50 &&
    acceptedTerms;

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      let response;
      if (accountRole === 'customer') {
        response = await authService.registerCustomer({
          firstname: form.firstname,
          lastname: form.lastname,
          email: form.email,
          phone_number: form.phone_number,
          password: form.password,
          confirm_password: form.confirm_password,
          city_id: selectedCity?.id || undefined,
        });
      } else {
        response = await authService.registerAgent({
          firstname: form.firstname,
          lastname: form.lastname,
          email: form.email,
          phone_number: form.phone_number,
          password: form.password,
          confirm_password: form.confirm_password,
          type: agentType,
          city_id: selectedCity?.id || undefined,
        });
      }

      // Store auth token so verify-email page can resend verification emails.
      // Use a dedicated session key and register the token getter so API calls
      // include this token automatically. We intentionally avoid localStorage's
      // `kh_sanctum_token` so AuthProvider doesn't treat the user as fully
      // authenticated and redirect them away from verify-email.
      if (response.token) {
        sessionStorage.setItem('kh_verify_token', response.token);
        registerTokenGetter(() => Promise.resolve(response.token));
        if (response.user?.id) {
          sessionStorage.setItem('user_id', response.user.id);
        }
        if (response.user?.email) {
          sessionStorage.setItem('kh_verify_email', response.user.email);
        }
      }

      setShowWelcome(true);
      setTimeout(() => {
        router.push('/verify-email');
      }, 3800);
    } catch (err) {
      setError(getSafeErrorMessage(err, "Erreur lors de l'inscription."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps =
    accountRole === 'customer'
      ? ['Type de compte', 'Informations', 'Sécurité']
      : ['Type de compte', 'Informations', 'Sécurité'];

  if (showWelcome) {
    return <WelcomeOverlay firstName={form.firstname} onSkip={() => router.push('/verify-email')} />;
  }

  return (
    <ThemeProvider theme={registerMuiTheme}>
      <Box sx={{ flex: 1, display: 'flex', minHeight: '100vh' }}>
        {/* Left side — image (crossfade particulier / agent) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: 'grey.900',
          }}
        >
          <Box
            aria-hidden={visual !== 'customer'}
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: visual === 'customer' ? 1 : 0,
              transform: visual === 'customer' ? 'scale(1)' : 'scale(1.04)',
              transition: 'opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1), transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
            }}
          >
            <Image
              src="/images/02Register.webp"
              alt=""
              fill
              priority
              sizes="50vw"
              style={{ objectFit: 'cover' }}
            />
          </Box>
          <Box
            aria-hidden={visual !== 'agent'}
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: visual === 'agent' ? 1 : 0,
              transform: visual === 'agent' ? 'scale(1)' : 'scale(1.04)',
              transition: 'opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1), transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
            }}
          >
            <Image
              src={REGISTER_AGENT_HERO_SRC}
              alt=""
              fill
              sizes="50vw"
              style={{ objectFit: 'cover' }}
            />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: tokens.overlayGradient,
              zIndex: 1,
              transition: 'background 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 6, zIndex: 2 }}>
            <FadeIn delay={0.2} direction="up">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: 42,
                    height: 42,
                    transition: 'opacity 0.35s ease',
                  }}
                >
                  <Image src={tokens.logoSrc} alt="KeyHome — Inscription" width={42} height={42} />
                </Box>
                <Typography variant="h4" fontWeight={700} color="#fff">
                  KeyHome
                </Typography>
              </Box>
            </FadeIn>
            <FadeIn delay={0.4} direction="up">
              <Box sx={{ minHeight: 88, maxWidth: 400 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={visual}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Typography variant="h5" color="rgba(255,255,255,0.92)" fontWeight={400} sx={{ maxWidth: 360 }}>
                      {tokens.tagline}
                    </Typography>
                  </motion.div>
                </AnimatePresence>
              </Box>
            </FadeIn>
          </Box>
        </Box>

      {/* Right side — form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 540px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 5 },
          overflowY: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile logo */}
          <FadeIn direction="none">
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                gap: 1,
                mb: 3,
                justifyContent: 'center',
                transition: 'opacity 0.35s ease',
              }}
            >
              <Image src={tokens.logoSrc} alt="KeyHome — Inscription" width={36} height={36} priority />
              <Typography variant="h6" fontWeight={700} color="primary.main">
                KeyHome
              </Typography>
            </Box>
          </FadeIn>

          <FadeIn delay={0.1} direction="up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Créer un compte
            </Typography>
            <Box sx={{ minHeight: 44, mb: 2 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={visual}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {tokens.formSubtitle}
                  </Typography>
                </motion.div>
              </AnimatePresence>
            </Box>
          </FadeIn>

          <FadeIn delay={0.15} direction="up">
            <AuthFlowStepper labels={steps} activeStep={step} />
          </FadeIn>

          {error && (
            <FadeIn direction="none" duration={0.3}>
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
            </FadeIn>
          )}

          {/* Step 0: Account type */}
          {step === 0 && (
            <FadeIn delay={0.2} direction="up">
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Quel type de compte souhaitez-vous créer ?
                </Typography>

                <ToggleButtonGroup
                  value={accountRole}
                  exclusive
                  onChange={(_, val) => val && setAccountRole(val)}
                  fullWidth
                  sx={{ mb: 3 }}
                >
                  <ToggleButton
                    value="customer"
                    sx={{
                      py: 2.5,
                      borderRadius: '12px !important',
                      textTransform: 'none',
                      flexDirection: 'column',
                      gap: 0.5,
                      '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } },
                    }}
                  >
                    <PersonOutline sx={{ fontSize: 28 }} />
                    <Typography variant="subtitle2" fontWeight={600}>Particulier</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Recherche de biens</Typography>
                  </ToggleButton>
                  <ToggleButton
                    value="agent"
                    sx={{
                      py: 2.5,
                      borderRadius: '12px !important',
                      textTransform: 'none',
                      flexDirection: 'column',
                      gap: 0.5,
                      ml: '12px !important',
                      '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } },
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 28 }} />
                    <Typography variant="subtitle2" fontWeight={600}>Agent / Agence</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Publication d&apos;annonces</Typography>
                  </ToggleButton>
                </ToggleButtonGroup>

                {accountRole === 'agent' && (
                  <FadeIn direction="up" duration={0.3}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      Précisez votre profil :
                    </Typography>
                    <ToggleButtonGroup
                      value={agentType}
                      exclusive
                      onChange={(_, val) => val && setAgentType(val)}
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      <ToggleButton
                        value="individual"
                        sx={{
                          py: 1.5,
                          borderRadius: '8px !important',
                          textTransform: 'none',
                          transition: 'background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease',
                          '&.Mui-selected': {
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            bgcolor: tokens.selectedBgAlpha,
                          },
                        }}
                      >
                        <PersonOutline sx={{ mr: 1 }} />
                        Indépendant
                      </ToggleButton>
                      <ToggleButton
                        value="agency"
                        disabled
                        title="Bientôt disponible — inscription en tant qu'agence"
                        aria-label="Agence — bientôt disponible"
                        sx={{
                          py: 1.5,
                          borderRadius: '8px !important',
                          textTransform: 'none',
                          ml: '8px !important',
                          cursor: 'not-allowed',
                          borderStyle: 'dashed',
                          opacity: 0.7,
                          '&.Mui-disabled': {
                            opacity: 0.7,
                            borderColor: 'divider',
                            color: 'text.disabled',
                          },
                        }}
                      >
                        <BusinessIcon sx={{ mr: 1 }} />
                        Agence
                      </ToggleButton>
                    </ToggleButtonGroup>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontStyle: 'italic' }}>
                      L&apos;inscription en tant qu&apos;agence sera bientôt disponible — pour l&apos;instant, choisissez « Indépendant ».
                    </Typography>
                  </FadeIn>
                )}

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    component={NextLink}
                    href={loginHref}
                    fullWidth
                    variant="outlined"
                    color="primary"
                    size="large"
                    sx={outlinedActionSx}
                  >
                    Retour
                  </Button>
                  <Button fullWidth variant="contained" size="large" onClick={() => setStep(1)} sx={containedGradientSx}>
                    Continuer
                  </Button>
                </Box>

                <SocialLoginButtons
                  onError={(err) => setError(err)}
                  disabled={isSubmitting}
                  registrationIntent={accountRole === 'agent' ? 'agent' : 'customer'}
                />
              </Box>
            </FadeIn>
          )}

          {/* Step 1: Personal info */}
          {step === 1 && (
            <FadeIn direction="left" duration={0.4}>
              <Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={form.firstname}
                    onChange={(e) => updateField('firstname', e.target.value)}
                    onFocus={firstnameLabelShrink.onFocus}
                    onBlur={() => {
                      markTouched('firstname');
                      firstnameLabelShrink.onBlur();
                    }}
                    required
                    autoFocus
                    error={touched.firstname && form.firstname.trim().length < 2}
                    helperText={touched.firstname && form.firstname.trim().length < 2 ? 'Le prénom doit contenir au moins 2 caractères' : ''}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                    }}
                    InputLabelProps={outlinedStartIconInputLabelProps(firstnameLabelShrink.shrink)}
                  />
                  <TextField
                    fullWidth
                    label="Nom"
                    value={form.lastname}
                    onChange={(e) => updateField('lastname', e.target.value)}
                    onBlur={() => markTouched('lastname')}
                    required
                    error={touched.lastname && form.lastname.trim().length < 2}
                    helperText={touched.lastname && form.lastname.trim().length < 2 ? 'Le nom doit contenir au moins 2 caractères' : ''}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Adresse email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  onFocus={emailLabelShrink.onFocus}
                  onBlur={() => {
                    markTouched('email');
                    emailLabelShrink.onBlur();
                  }}
                  required
                  error={touched.email && !form.email.includes('@')}
                  helperText={touched.email && !form.email.includes('@') ? 'Veuillez entrer une adresse email valide' : ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                  }}
                  InputLabelProps={outlinedStartIconInputLabelProps(emailLabelShrink.shrink)}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ mb: 2 }}>
                  <PhoneField
                    value={form.phone_number}
                    onChange={(val) => updateField('phone_number', val)}
                    required
                    error={form.phone_number.length > 0 && !isPhoneValid}
                    helperText={
                      form.phone_number.length > 0 && !isPhoneValid
                        ? 'Format invalide (ex: +237 6XX XXX XXX)'
                        : ''
                    }
                  />
                </Box>
                <Autocomplete
                  options={cities}
                  getOptionLabel={(opt) => opt.name}
                  value={selectedCity}
                  onChange={(_, val) => { setSelectedCity(val); setCityDropdownOpen(false); }}
                  inputValue={cityInput}
                  onInputChange={(_, val, reason) => { if (reason !== 'reset') { setCityInput(val); setCityDropdownOpen(val.length >= 1); } }}
                  onClose={() => setCityDropdownOpen(false)}
                  open={cityDropdownOpen && cityInput.length >= 1 && !isCitiesLoading && cities.length > 0}
                  filterOptions={(x) => x}
                  loading={isCitiesLoading}
                  noOptionsText="Aucune ville trouvée"
                  slotProps={citySlotProps}
                  renderOption={(props, option) => renderCityOption(props, option)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ville"
                      placeholder="Rechercher une ville..."
                      sx={cityInputSx}
                      InputLabelProps={mergeOutlinedStartIconInputLabelProps(
                        params.InputLabelProps,
                        selectedCity != null || cityLabelFocused,
                      )}
                      inputProps={{
                        ...params.inputProps,
                        onFocus: (e: FocusEvent<HTMLInputElement>) => {
                          setCityLabelFocused(true);
                          params.inputProps?.onFocus?.(e);
                        },
                        onBlur: (e: FocusEvent<HTMLInputElement>) => {
                          setCityLabelFocused(false);
                          params.inputProps?.onBlur?.(e);
                        },
                      }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start"><CityIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {isCitiesLoading ? <CircularProgress color="inherit" size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  sx={{ mb: 3 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    size="large"
                    onClick={() => setStep(0)}
                    sx={outlinedActionSx}
                  >
                    Retour
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!canProceedStep1}
                    onClick={() => setStep(2)}
                    sx={containedGradientSx}
                  >
                    Continuer
                  </Button>
                </Box>
              </Box>
            </FadeIn>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <FadeIn direction="left" duration={0.4}>
              <Box>
                <TextField
                  fullWidth
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  onFocus={passwordLabelShrink.onFocus}
                  onBlur={passwordLabelShrink.onBlur}
                  required
                  autoFocus
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={outlinedStartIconInputLabelProps(passwordLabelShrink.shrink)}
                  sx={{ mb: 1 }}
                />

                {form.password.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength.score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: passwordStrength.color,
                          borderRadius: 3,
                          transition: 'width 0.4s ease, background-color 0.4s ease',
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: passwordStrength.color, display: 'block', mt: 0.5, fontWeight: 600 }}>
                      {passwordStrength.label}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.25, mt: 1 }}>
                      {[
                        { met: form.password.length >= 8, label: '8 caractères min.' },
                        { met: /[A-Z]/.test(form.password), label: 'Une majuscule' },
                        { met: /[0-9]/.test(form.password), label: 'Un chiffre' },
                        { met: /[^A-Za-z0-9]/.test(form.password), label: 'Un symbole' },
                      ].map((req) => (
                        <Box key={req.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {req.met ? (
                            <CheckIcon sx={{ fontSize: 14, color: '#2e7d32' }} />
                          ) : (
                            <CloseIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          )}
                          <Typography variant="caption" color={req.met ? '#2e7d32' : 'text.secondary'}>
                            {req.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Confirmer le mot de passe"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={(e) => updateField('confirm_password', e.target.value)}
                  onFocus={confirmPasswordLabelShrink.onFocus}
                  onBlur={confirmPasswordLabelShrink.onBlur}
                  required
                  error={form.confirm_password.length > 0 && form.password !== form.confirm_password}
                  helperText={
                    form.confirm_password.length > 0 && form.password !== form.confirm_password
                      ? 'Les mots de passe ne correspondent pas'
                      : ''
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small" aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}>
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={outlinedStartIconInputLabelProps(confirmPasswordLabelShrink.shrink)}
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      sx={{
                        transition: 'color 0.35s ease',
                        '&.Mui-checked': { color: 'primary.main' },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      J&apos;accepte les{' '}
                      <Link href="/conditions" target="_blank" sx={{ color: 'primary.main' }}>conditions d&apos;utilisation</Link>
                      {' '}et la{' '}
                      <Link href="/confidentialite" target="_blank" sx={{ color: 'primary.main' }}>politique de confidentialité</Link>
                    </Typography>
                  }
                  sx={{ mb: 2, alignItems: 'flex-start' }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    size="large"
                    onClick={() => setStep(1)}
                    sx={outlinedActionSx}
                  >
                    Retour
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!canSubmit || isSubmitting}
                    onClick={handleSubmit}
                    sx={containedGradientSx}
                  >
                    {isSubmitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : "S'inscrire"}
                  </Button>
                </Box>
              </Box>
            </FadeIn>
          )}

          <FadeIn delay={0.5} direction="up">
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
              Déjà un compte ?{' '}
              <Link
                component={NextLink}
                href={loginHref}
                underline="hover"
                sx={{ fontWeight: 600, color: 'primary.main' }}
              >
                Se connecter
              </Link>
            </Typography>
          </FadeIn>
        </Box>
      </Box>
    </Box>
    </ThemeProvider>
  );
}
