'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationCity as CityIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { authService } from '@/services/auth.service';
import { citiesService } from '@/services/cities.service';
import { City } from '@/types';
import { AxiosError } from 'axios';
import FadeIn from '@/components/ui/FadeIn';

type ApiErrorResponse = { message?: string; errors?: Record<string, string[]> };

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
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const { data: citiesData } = useQuery({
    queryKey: ['register-cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const cities = citiesData?.data || [];

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedStep0 =
    form.firstname.trim().length >= 2 &&
    form.lastname.trim().length >= 2 &&
    form.email.includes('@') &&
    form.phone_number.trim().length >= 10;

  const passwordStrength = getPasswordStrength(form.password);
  const canSubmit =
    form.password.length >= 8 &&
    form.password === form.confirm_password &&
    passwordStrength.score >= 50;

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      await authService.registerCustomer({
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,
        confirm_password: form.confirm_password,
        city_id: selectedCity?.id || undefined,
      });
      router.push('/verify-email');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      const msg = axiosErr?.response?.data?.message || "Erreur lors de l'inscription.";
      const errors = axiosErr?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors).flat()[0];
        setError(String(firstError));
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Informations personnelles', 'Sécurité'];

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
          src="/images/Porterustique.jpg"
          alt="Rejoignez KeyHome"
          fill
          priority
          sizes="50vw"
          style={{ objectFit: 'cover' }}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAABv/EAB4QAAICAgIDAAAAAAAAAAAAAAABAgMEEQUhEjFB/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAYEQADAQEAAAAAAAAAAAAAAAABAgMAEf/aAAwDAQACEQMRAD8AjeN5O/JzIVY8pxjJ7aXoGALRYiLgmf/Z"
        />
        {/* Dark overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(34,34,34,0.15) 0%, rgba(34,34,34,0.6) 100%)',
            zIndex: 1,
          }}
        />
        {/* Overlay content */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Image src="/images/logo.png" alt="KeyHome" width={42} height={42} />
              <Typography variant="h4" fontWeight={700} color="#fff">
                KeyHome
              </Typography>
            </Box>
          </FadeIn>
          <FadeIn delay={0.4} direction="up">
            <Typography variant="h5" color="rgba(255,255,255,0.9)" fontWeight={400} sx={{ maxWidth: 360 }}>
              Trouvez votre prochain chez-vous au Cameroun
            </Typography>
          </FadeIn>
        </Box>
      </Box>

      {/* Right side — form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 520px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6 },
          overflowY: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <FadeIn direction="none">
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                gap: 1,
                mb: 3,
                justifyContent: 'center',
              }}
            >
              <Image src="/images/logo.png" alt="KeyHome" width={36} height={36} priority />
              <Typography variant="h6" fontWeight={700} color="primary.main">
                KeyHome
              </Typography>
            </Box>
          </FadeIn>

          <FadeIn delay={0.1} direction="up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Créer un compte
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Inscrivez-vous pour accéder aux annonces immobilières
            </Typography>
          </FadeIn>

          <FadeIn delay={0.15} direction="up">
            <Stepper activeStep={step} sx={{ mb: 3 }} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </FadeIn>

          {error && (
            <FadeIn direction="none" duration={0.3}>
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
            </FadeIn>
          )}

          {/* Step 0: Personal info */}
          {step === 0 && (
            <FadeIn delay={0.2} direction="up">
              <Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={form.firstname}
                    onChange={(e) => updateField('firstname', e.target.value)}
                    required
                    autoFocus
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Nom"
                    value={form.lastname}
                    onChange={(e) => updateField('lastname', e.target.value)}
                    required
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Adresse email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                    },
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={form.phone_number}
                  onChange={(e) => updateField('phone_number', e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  required
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                    },
                  }}
                  sx={{ mb: 2 }}
                />

                <Autocomplete
                  options={cities}
                  getOptionLabel={(opt) => opt.name}
                  value={selectedCity}
                  onChange={(_, val) => setSelectedCity(val)}
                  inputValue={cityInput}
                  onInputChange={(_, val) => setCityInput(val)}
                  noOptionsText="Aucune ville trouvée"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ville"
                      placeholder="Sélectionnez votre ville"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start"><CityIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                  sx={{ mb: 3 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={!canProceedStep0}
                  onClick={() => setStep(1)}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    background: 'linear-gradient(to right, #F6475F, #D93A50)',
                    '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                  }}
                >
                  Continuer
                </Button>
              </Box>
            </FadeIn>
          )}

          {/* Step 1: Password */}
          {step === 1 && (
            <FadeIn direction="left" duration={0.4}>
              <Box>
                <TextField
                  fullWidth
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  autoFocus
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: passwordStrength.color, transition: 'color 0.3s' }}>
                        {passwordStrength.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Min: 8 car., majuscule, chiffre, symbole
                      </Typography>
                    </Box>
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Confirmer le mot de passe"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={(e) => updateField('confirm_password', e.target.value)}
                  required
                  error={form.confirm_password.length > 0 && form.password !== form.confirm_password}
                  helperText={
                    form.confirm_password.length > 0 && form.password !== form.confirm_password
                      ? 'Les mots de passe ne correspondent pas'
                      : ''
                  }
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ mb: 3 }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={() => setStep(0)}
                    sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
                  >
                    Retour
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!canSubmit || isSubmitting}
                    onClick={handleSubmit}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      background: 'linear-gradient(to right, #F6475F, #D93A50)',
                      '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                    }}
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
              <Link href="/login" underline="hover" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Se connecter
              </Link>
            </Typography>
          </FadeIn>
        </Box>
      </Box>
    </Box>
  );
}
