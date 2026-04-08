'use client';

import AuthFlowStepper from '@/components/auth/AuthFlowStepper';
import FadeIn from '@/components/ui/FadeIn';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { OWNER_LOGO_SRC } from '@/lib/owner-auth-assets';
import { KH_OWNER_POST_OTP_TOKEN_KEY } from '@/lib/owner-auth-flow';
import { registerTokenGetter } from '@/lib/auth-token';
import { persistInMemoryToken } from '@/lib/auth-session';
import { authService } from '@/services/auth.service';
import { brandAgent } from '@/theme/tokens';
import { ArrowBack, Refresh as RefreshIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const RESEND_COOLDOWN = 60;

export default function OwnerVerifyOtpPage() {
  const router = useRouter();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const [isReady, setIsReady] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useLayoutEffect(() => {
    const stored = sessionStorage.getItem('kh_verify_token_owner');
    if (stored) {
      registerTokenGetter(() =>
        Promise.resolve(
          typeof window !== 'undefined'
            ? sessionStorage.getItem('kh_verify_token_owner')
            : null
        )
      );
    }
  }, []);

  useEffect(() => {
    // Small delay to ensure sessionStorage is properly synced after navigation
    const timer = setTimeout(() => {
      const storedEmail = sessionStorage.getItem('kh_verify_email_owner') ?? '';
      const storedRole = sessionStorage.getItem('kh_register_role') ?? '';

      // Force owner context or redirect if not appropriate
      if (storedRole !== 'agent') {
        router.replace('/verify-email');
        return;
      }

      setEmail(storedEmail);
      setIsReady(true);
      inputRefs.current[0]?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const otp = digits.join('');
  const isComplete = otp.length === 6 && digits.every((d) => d !== '');

  const accentColor = brandAgent.primary;
  const buttonGradient = `linear-gradient(to right, ${brandAgent.primaryLight}, ${brandAgent.primary})`;
  const buttonGradientHover = `linear-gradient(to right, ${brandAgent.primary}, ${brandAgent.primaryDark})`;

  const logoSrc = OWNER_LOGO_SRC;
  const heroSrc = '/images/owner/Real%20Estate%20Teal.webp';
  const heroOverlay =
    'linear-gradient(to bottom, rgba(15,118,110,0.28) 0%, rgba(15,23,42,0.78) 100%)';
  const tagline = 'Plus qu’un pas pour gérer vos biens professionnellement';
  const stepperLabels = ['Inscription', 'Vérification', 'Dashboard'];

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
    if (!isComplete) return;
    if (!email) {
      setError(
        'Adresse email introuvable. Veuillez recommencer l\u2019inscription.'
      );
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const result = await authService.verifyEmailOtp(email, otp);

      // Same sequence as OAuth → Clerk: OTP → complete-profile (welcome) → finalize → dashboard + tours/surveys.
      persistInMemoryToken(result.access_token);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          KH_OWNER_POST_OTP_TOKEN_KEY,
          result.access_token
        );
      }

      sessionStorage.removeItem('kh_verify_token_owner');
      sessionStorage.removeItem('kh_verify_email_owner');
      sessionStorage.removeItem('kh_register_role');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user_id');

      router.replace('/owner/auth/complete-profile');
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

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;
    if (!email) {
      setError(
        'Adresse email introuvable. Veuillez recommencer l\u2019inscription.'
      );
      return;
    }
    setError('');
    setResendMessage('');
    try {
      await authService.resendVerification(email);
      setResendMessage('Un nouveau code professionnel a été envoyé.');
      setResendCooldown(RESEND_COOLDOWN);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(getSafeErrorMessage(err, 'Impossible de renvoyer le code.'));
    }
  }, [resendCooldown, email]);

  const maskedEmail = email
    ? email.replace(
        /^(.{1,2})(.*)(@.*)$/,
        (_, start, middle, domain) =>
          start + '*'.repeat(Math.min(middle.length, 5)) + domain
      )
    : '';

  // Show loading state while checking sessionStorage
  if (!isReady) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress sx={{ color: brandAgent.primary }} />
      </Box>
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
          src={heroSrc}
          alt="Vérification Bailleur KeyHome"
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
              <Image
                src={logoSrc}
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
              {tagline}
            </Typography>
          </FadeIn>
        </Box>
      </Box>

      {/* Right side — OTP form */}
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
              src={logoSrc}
              alt="KeyHome Business"
              width={40}
              height={40}
              priority
            />
            <Typography variant="h5" fontWeight={700} color={accentColor}>
              KeyHome Business
            </Typography>
          </Box>
        </FadeIn>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <FadeIn delay={0.05} direction="none">
            <AuthFlowStepper labels={stepperLabels} activeStep={1} />
          </FadeIn>

          <FadeIn delay={0.1} direction="up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Vérification Bailleur
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 1, color: accentColor, fontWeight: 600 }}
            >
              Espace Professionnel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Saisissez le code de sécurité envoyé à{' '}
              <Typography
                component="span"
                fontWeight={600}
                color="text.primary"
                variant="body2"
              >
                {maskedEmail}
              </Typography>
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
                  sx={{
                    width: '100%',
                    height: 56,
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: digit ? accentColor : 'divider',
                    bgcolor: digit ? alpha(accentColor, 0.05) : 'transparent',
                    outline: 'none',
                    transition: 'all 0.2s',
                    '&:focus': {
                      borderColor: accentColor,
                      boxShadow: `0 0 0 4px ${alpha(accentColor, 0.1)}`,
                    },
                  }}
                />
              ))}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                {error}
              </Alert>
            )}
            {resendMessage && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
                {resendMessage}
              </Alert>
            )}

            <Button
              fullWidth
              size="large"
              variant="contained"
              disabled={!isComplete || isSubmitting}
              onClick={handleSubmit}
              sx={{
                py: 1.8,
                borderRadius: '14px',
                background: buttonGradient,
                '&:hover': { background: buttonGradientHover },
                boxShadow: `0 8px 20px ${alpha(accentColor, 0.25)}`,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Confirmer et accéder au Dashboard'
              )}
            </Button>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Vous n&apos;avez pas reçu le code ?
              </Typography>
              <Button
                startIcon={<RefreshIcon />}
                disabled={resendCooldown > 0}
                onClick={handleResendOtp}
                sx={{
                  color: accentColor,
                  fontWeight: 600,
                  textTransform: 'none',
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

function alpha(color: string, opacity: number): string {
  return (
    color +
    Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')
  );
}
