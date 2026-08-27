'use client';

import AuthFlowStepper from '@/components/auth/AuthFlowStepper';
import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import FadeIn from '@/components/ui/layout/FadeIn';
import WelcomeOverlay from '@/components/ui/overlay/WelcomeOverlay';
import { trackSignUp } from '@/lib/analytics/track-events';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { brandAgent, gradient } from '@/theme/tokens';
import { User } from '@/types';
import ArrowBack from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Cooldown (seconds) between OTP resend requests */
const RESEND_COOLDOWN = 60;

export default function VerifyOtpPage() {
  const { finalizeAuth, getClerkToken } = useAuth();
  const router = useRouter();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [emailHint, setEmailHint] = useState('');
  const [isAgent, setIsAgent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeFirstName, setWelcomeFirstName] = useState<string | undefined>(
    undefined
  );
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeResultRef = useRef<{
    token: string;
    user: User;
    panel_sso_url: string | null;
    expires_at: string | null;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
    };
  }, []);

  const accentGradient = isAgent
    ? `linear-gradient(to right, ${brandAgent.primaryLight}, ${brandAgent.primary})`
    : undefined;

  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hint = sessionStorage.getItem('clerk_auth_email_hint') ?? '';
    setEmailHint(hint);
    setIsAgent(sessionStorage.getItem('kh_registration_intent') === 'agent');
    otpInputRef.current?.focus();
  }, []);

  // Web OTP API (Android Chrome) — récupère le code SMS automatiquement
  useEffect(() => {
    if (!('OTPCredential' in window)) return;

    const ac = new AbortController();
    const id = setTimeout(() => {
      const input = otpInputRef.current;
      if (!input) return;

      const form = input.closest('form');
      if (form) {
        form.addEventListener('submit', () => ac.abort(), { once: true });
      }

      navigator.credentials
        .get({
          otp: { transport: ['sms'] },
          signal: ac.signal,
        } as CredentialRequestOptions)
        .then((cred) => {
          const otpCred = cred as { code?: string };
          if (otpCred?.code) {
            const code = otpCred.code.replace(/\D/g, '').slice(0, 6);
            const newDigits = code
              .split('')
              .concat(Array(6).fill(''))
              .slice(0, 6);
            setDigits(newDigits);
          }
        })
        .catch(() => {});
    }, 100);

    return () => {
      clearTimeout(id);
      ac.abort();
    };
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

  const handleSubmit = async () => {
    if (!isComplete) return;
    setError('');
    setIsSubmitting(true);
    try {
      const result = await authService.verifyClerkOtp(otp);
      if (result.state === 'profile_required') {
        const firstName = result.prefill?.firstname;
        setWelcomeFirstName(firstName);
        try {
          const r = await authService.completeClerkProfile({});
          sessionStorage.removeItem('clerk_auth_prefill');
          sessionStorage.removeItem('kh_registration_intent');
          completeResultRef.current = r;
          trackSignUp('email');
          setShowWelcome(true);
          welcomeTimerRef.current = setTimeout(() => {
            const expMs = r.expires_at
              ? new Date(r.expires_at).getTime()
              : undefined;
            finalizeAuth(r.token, r.user, r.panel_sso_url, expMs);
          }, 3800);
        } catch (profileErr) {
          setError(
            getSafeErrorMessage(
              profileErr,
              'Erreur lors de la création du compte. Veuillez réessayer.'
            )
          );
        }
        return;
      }
      const expMs = result.expires_at
        ? new Date(result.expires_at).getTime()
        : undefined;
      finalizeAuth(result.token, result.user, result.panel_sso_url, expMs);
    } catch (err) {
      setError(
        getSafeErrorMessage(err, 'Code invalide ou expiré. Veuillez réessayer.')
      );
      setDigits(['', '', '', '', '', '']);
      otpInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Re-trigger the Clerk exchange to send a fresh OTP */
  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;
    setError('');
    setResendMessage('');
    try {
      const freshToken = await getClerkToken();
      const intentRaw = sessionStorage.getItem('kh_registration_intent');
      const registration_intent = intentRaw === 'agent' ? 'agent' : 'customer';
      await authService.clerkExchange(freshToken, { registration_intent });
      setResendMessage('Un nouveau code a été envoyé à votre adresse email.');
      setResendCooldown(RESEND_COOLDOWN);
      setDigits(['', '', '', '', '', '']);
      otpInputRef.current?.focus();
    } catch (err) {
      setError(
        getSafeErrorMessage(
          err,
          'Impossible de renvoyer le code. Veuillez réessayer.'
        )
      );
    }
  }, [resendCooldown, getClerkToken]);

  if (showWelcome) {
    return (
      <WelcomeOverlay
        firstName={welcomeFirstName}
        isOwner={isAgent}
        onSkip={() => {
          if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
          const r = completeResultRef.current;
          if (r) {
            const expMs = r.expires_at
              ? new Date(r.expires_at).getTime()
              : undefined;
            finalizeAuth(r.token, r.user, r.panel_sso_url, expMs);
          }
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
          src="/images/02OTP.webp"
          alt="Vérification KeyHome"
          fill
          priority
          sizes="50vw"
          style={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: isAgent
              ? `linear-gradient(to bottom, rgba(13,148,136,0.2) 0%, rgba(13,148,136,0.55) 100%)`
              : 'linear-gradient(to bottom, rgba(34,34,34,0.15) 0%, rgba(34,34,34,0.6) 100%)',
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
                alt="KeyHome — Vérification code OTP"
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
              Sécurité avant tout
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
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1,
              mb: 4,
            }}
          >
            <Image
              src="/images/logo.png"
              alt="KeyHome — Vérification code OTP"
              width={40}
              height={40}
              priority
            />
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ color: isAgent ? brandAgent.primary : 'primary.main' }}
            >
              KeyHome
            </Typography>
          </Box>
        </FadeIn>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Compact OAuth flow progress */}
          <FadeIn delay={0.05} direction="none">
            <AuthFlowStepper
              labels={['Connexion', 'Vérification', 'Terminé']}
              activeStep={1}
              accentColor={isAgent ? brandAgent.primary : undefined}
            />
          </FadeIn>

          <FadeIn delay={0.1} direction="up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Code de vérification
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Saisissez le code à 6 chiffres envoyé à{' '}
              {emailHint ? (
                <Typography
                  component="span"
                  fontWeight={600}
                  color="text.primary"
                  variant="body2"
                >
                  {emailHint}
                </Typography>
              ) : (
                'votre adresse email'
              )}
              .
            </Typography>
          </FadeIn>

          <FadeIn delay={0.2} direction="up">
            {/* form wrapper is required for iOS/Android SMS OTP autofill */}
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              autoComplete="on"
            >
              {/* Champ unique pour autofill (iOS) et Web OTP (Android) — superposé aux 6 cases */}
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 0.75, sm: 1.5 },
                  mb: 3,
                  position: 'relative',
                  cursor: 'text',
                }}
                onClick={() => otpInputRef.current?.focus()}
              >
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  value={digits.join('')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                    const newDigits = raw
                      .split('')
                      .concat(Array(6).fill(''))
                      .slice(0, 6);
                    setDigits(newDigits);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData
                      .getData('text')
                      .replace(/\D/g, '')
                      .slice(0, 6);
                    const newDigits = pasted
                      .split('')
                      .concat(Array(6).fill(''))
                      .slice(0, 6);
                    setDigits(newDigits);
                  }}
                  aria-label="Code de vérification à 6 chiffres"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    caretColor: 'transparent',
                    cursor: 'text',
                    fontSize: 'clamp(18px, 5vw, 28px)',
                    letterSpacing: '0.5em',
                    width: '100%',
                    boxSizing: 'border-box',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                  }}
                />
                {digits.map((digit, index) => (
                  <Box
                    key={index}
                    component="span"
                    sx={(theme) => ({
                      flex: 1,
                      minWidth: 0,
                      width: 'clamp(36px, 12vw, 56px)',
                      height: 'clamp(44px, 13vw, 64px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(18px, 5vw, 28px)',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                      border: '2px solid',
                      borderColor: digit
                        ? isAgent
                          ? brandAgent.primary
                          : 'primary.main'
                        : 'divider',
                      borderRadius: '10px',
                      bgcolor: digit
                        ? alpha(
                            isAgent
                              ? brandAgent.primary
                              : theme.palette.primary.main,
                            theme.palette.mode === 'dark' ? 0.22 : 0.08
                          )
                        : theme.palette.mode === 'dark'
                          ? theme.palette.grey[900]
                          : theme.palette.background.paper,
                      color: 'text.primary',
                      transition: 'border-color 0.15s, background-color 0.15s',
                      pointerEvents: 'none',
                    })}
                  >
                    {digit}
                  </Box>
                ))}
              </Box>

              {error && (
                <FadeIn direction="none" duration={0.3}>
                  <AppAlert
                    severity="error"
                    id="verify-otp-error"
                    message={error}
                    sx={{ mb: 2 }}
                  />
                </FadeIn>
              )}
              {resendMessage && (
                <FadeIn direction="none" duration={0.3}>
                  <AppAlert
                    severity="success"
                    message={resendMessage}
                    sx={{ mb: 2 }}
                  />
                </FadeIn>
              )}

              <FadeIn delay={0.3} direction="up">
                <Button
                  type="submit"
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
                      isAgent
                        ? accentGradient
                        : t.palette.mode === 'dark'
                          ? `linear-gradient(to right, ${t.palette.primary.dark}, ${t.palette.primary.main})`
                          : gradient.primary,
                    '&:hover': {
                      background: (t) =>
                        isAgent
                          ? accentGradient
                          : t.palette.mode === 'dark'
                            ? `linear-gradient(to right, ${t.palette.primary.main}, ${t.palette.primary.light})`
                            : gradient.primaryHover,
                    },
                    '&:active': { transform: 'scale(0.97)' },
                  }}
                >
                  {isSubmitting ? (
                    <ButtonSpinner size={24} />
                  ) : (
                    'Vérifier le code'
                  )}
                </Button>
              </FadeIn>
            </Box>
          </FadeIn>

          {/* Resend OTP */}
          <FadeIn delay={0.4} direction="up">
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Vous n&apos;avez pas reçu le code ?
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
                      : isAgent
                        ? brandAgent.primary
                        : 'primary.main',
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
