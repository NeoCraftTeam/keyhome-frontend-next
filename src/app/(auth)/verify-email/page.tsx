'use client';

import AuthFlowStepper from '@/components/auth/AuthFlowStepper';
import FadeIn from '@/components/ui/FadeIn';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { OWNER_LOGO_SRC } from '@/lib/owner-auth-assets';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { brandAgent, gradient } from '@/theme/tokens';
import { UserRole } from '@/types';
import { ArrowBack, Refresh as RefreshIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Cooldown (seconds) between OTP resend requests */
const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  const { finalizeAuth } = useAuth();
  const router = useRouter();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('kh_verify_email_client') ?? '';
    const storedRole = sessionStorage.getItem('kh_register_role') ?? '';
    setEmail(storedEmail);
    setIsOwner(storedRole === 'agent');
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const otp = digits.join('');
  const isComplete = otp.length === 6 && digits.every((d) => d !== '');

  // Owner (teal) vs client (pink) theming
  const accentColor = isOwner ? brandAgent.primary : undefined;
  const buttonGradient = useMemo(
    () =>
      isOwner
        ? `linear-gradient(to right, ${brandAgent.primaryLight}, ${brandAgent.primary})`
        : gradient.primary,
    [isOwner]
  );
  const buttonGradientHover = useMemo(
    () =>
      isOwner
        ? `linear-gradient(to right, ${brandAgent.primary}, ${brandAgent.primaryDark})`
        : gradient.primaryHover,
    [isOwner]
  );
  const logoSrc = isOwner ? OWNER_LOGO_SRC : '/images/logo.png';
  const heroSrc = isOwner
    ? '/images/owner/Real%20Estate%20Teal.webp'
    : '/images/02OTP.webp';
  const heroOverlay = isOwner
    ? 'linear-gradient(to bottom, rgba(15,118,110,0.28) 0%, rgba(15,23,42,0.78) 100%)'
    : 'linear-gradient(to bottom, rgba(34,34,34,0.15) 0%, rgba(34,34,34,0.6) 100%)';
  const tagline = isOwner
    ? 'Plus qu\u2019un pas pour g\u00e9rer vos biens'
    : 'Un dernier pas avant de commencer';
  const stepperLabels = isOwner
    ? ['Inscription', 'V\u00e9rification', 'Dashboard']
    : ['Inscription', 'V\u00e9rification', 'Termin\u00e9'];

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    const newDigits = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(newDigits);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async () => {
    if (!isComplete || !email) return;
    setError('');
    setIsSubmitting(true);
    try {
      const result = await authService.verifyEmailOtp(email, otp);

      // Resolve the user role: prefer the top-level field from the API,
      // then fall back to the user object, then sessionStorage.
      const resolvedRole =
        (result.role as UserRole | undefined) ??
        result.user?.role ??
        (sessionStorage.getItem('kh_register_role') === 'agent'
          ? UserRole.AGENT
          : UserRole.CUSTOMER);

      // Ensure the user object has the role so finalizeAuth routes correctly.
      const userWithRole = { ...result.user, role: resolvedRole };

      // Clean up session storage
      sessionStorage.removeItem('kh_verify_token_client');
      sessionStorage.removeItem('kh_verify_email_client');
      sessionStorage.removeItem('kh_register_role');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user_id');

      // Auto-login: finalizeAuth stores the Sanctum token, sets the user,
      // and redirects to /owner/dashboard (agent) or /home (customer).
      finalizeAuth(result.access_token, userWithRole, null);
    } catch (err) {
      setError(
        getSafeErrorMessage(err, 'Code invalide ou expiré. Veuillez réessayer.')
      );
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Re-send the OTP code to the user's email */
  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0 || !email) return;
    setError('');
    setResendMessage('');
    try {
      await authService.resendVerification(email);
      setResendMessage(
        'Un nouveau code a \u00e9t\u00e9 envoy\u00e9 \u00e0 votre adresse email.'
      );
      setResendCooldown(RESEND_COOLDOWN);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(
        getSafeErrorMessage(
          err,
          'Impossible de renvoyer le code. Veuillez r\u00e9essayer.'
        )
      );
    }
  }, [resendCooldown, email]);

  /** Mask the email for display: je***@example.com */
  const maskedEmail = email
    ? email.replace(
        /^(.{1,2})(.*)(@.*)$/,
        (_, start, middle, domain) =>
          start + '*'.repeat(Math.min(middle.length, 5)) + domain
      )
    : '';

  return (
    <Box sx={{ flex: 1, display: 'flex', minHeight: '100vh' }}>
      {/* Left side \u2014 image */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Image
          src={heroSrc}
          alt="V\u00e9rification KeyHome"
          fill
          priority
          sizes="50vw"
          style={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: heroOverlay,
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
              <Image src={logoSrc} alt="KeyHome" width={42} height={42} />
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
              {tagline}
            </Typography>
          </FadeIn>
        </Box>
      </Box>

      {/* Right side \u2014 OTP form */}
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
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1,
              mb: 4,
            }}
          >
            <Image
              src={logoSrc}
              alt="KeyHome"
              width={40}
              height={40}
              priority
            />
            <Typography
              variant="h5"
              fontWeight={700}
              color={accentColor ?? 'primary.main'}
            >
              KeyHome
            </Typography>
          </Box>
        </FadeIn>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Progress stepper */}
          <FadeIn delay={0.05} direction="none">
            <AuthFlowStepper labels={stepperLabels} activeStep={1} />
          </FadeIn>

          <FadeIn delay={0.1} direction="up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Vérifiez votre email
            </Typography>
            {isOwner && (
              <Typography
                variant="body2"
                sx={{ mb: 1, color: brandAgent.primary, fontWeight: 600 }}
              >
                Espace Bailleur
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Saisissez le code à 6 chiffres envoyé à{' '}
              {maskedEmail ? (
                <Typography
                  component="span"
                  fontWeight={600}
                  color="text.primary"
                  variant="body2"
                >
                  {maskedEmail}
                </Typography>
              ) : (
                'votre adresse email'
              )}
              .
            </Typography>
          </FadeIn>

          <FadeIn delay={0.2} direction="up">
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
              {digits.map((digit, index) => (
                <Box
                  key={index}
                  component="input"
                  ref={(el: HTMLInputElement | null) => {
                    inputRefs.current[index] = el;
                  }}
                  value={digit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(index, e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                    handleKeyDown(index, e)
                  }
                  onPaste={handlePaste}
                  maxLength={1}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  sx={(theme) => ({
                    minWidth: 42,
                    maxWidth: 52,
                    flex: 1,
                    height: 60,
                    fontSize: 26,
                    fontWeight: 700,
                    textAlign: 'center',
                    borderRadius: '10px',
                    border: '2px solid',
                    borderColor: digit
                      ? (accentColor ?? theme.palette.primary.main)
                      : 'divider',
                    outline: 'none',
                    bgcolor: digit
                      ? alpha(
                          accentColor ?? theme.palette.primary.main,
                          theme.palette.mode === 'dark' ? 0.22 : 0.08
                        )
                      : theme.palette.mode === 'dark'
                        ? theme.palette.grey[900]
                        : theme.palette.background.paper,
                    color: 'text.primary',
                    transition: 'border-color 0.15s, background-color 0.15s',
                    cursor: 'text',
                    boxSizing: 'border-box',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button':
                      {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                  })}
                />
              ))}
            </Box>
          </FadeIn>

          {error && (
            <FadeIn direction="none" duration={0.3}>
              <Alert
                severity="error"
                id="verify-email-error"
                sx={{ mb: 2, borderRadius: 2 }}
              >
                {error}
              </Alert>
            </FadeIn>
          )}
          {resendMessage && (
            <FadeIn direction="none" duration={0.3}>
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                {resendMessage}
              </Alert>
            </FadeIn>
          )}

          <FadeIn delay={0.3} direction="up">
            <Button
              onClick={handleSubmit}
              variant="contained"
              size="large"
              fullWidth
              disabled={!isComplete || isSubmitting}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '14px',
                textTransform: 'none',
                background: (t) =>
                  t.palette.mode === 'dark'
                    ? `linear-gradient(to right, ${t.palette.primary.dark}, ${t.palette.primary.main})`
                    : buttonGradient,
                '&:hover': {
                  background: (t) =>
                    t.palette.mode === 'dark'
                      ? `linear-gradient(to right, ${t.palette.primary.main}, ${t.palette.primary.light})`
                      : buttonGradientHover,
                },
                '&:active': { transform: 'scale(0.97)' },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ color: '#fff' }} />
              ) : (
                'V\u00e9rifier le code'
              )}
            </Button>
          </FadeIn>

          {/* Resend OTP */}
          <FadeIn delay={0.4} direction="up">
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Vous n&apos;avez pas re\u00e7u le code ?
              </Typography>
              <Button
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                startIcon={<RefreshIcon />}
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color:
                    resendCooldown > 0
                      ? 'text.disabled'
                      : (accentColor ?? 'primary.main'),
                }}
              >
                {resendCooldown > 0
                  ? `Renvoyer dans ${resendCooldown}s`
                  : 'Renvoyer le code'}
              </Button>
            </Box>
          </FadeIn>
        </Box>
      </Box>
    </Box>
  );
}
