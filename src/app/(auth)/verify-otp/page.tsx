'use client';

import FadeIn from '@/components/ui/FadeIn';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { ArrowBack, Refresh as RefreshIcon } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, IconButton, Typography } from '@mui/material';
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
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const hint = sessionStorage.getItem('clerk_auth_email_hint') ?? '';
    setEmailHint(hint);
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

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(newDigits);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async () => {
    if (!isComplete) return;
    setError('');
    setIsSubmitting(true);
    try {
      const result = await authService.verifyClerkOtp(otp);
      if (result.state === 'profile_required') {
        sessionStorage.setItem('clerk_auth_prefill', JSON.stringify(result.prefill));
        router.replace('/complete-profile');
        return;
      }
      finalizeAuth(result.token, result.user, result.panel_sso_url);
    } catch (err) {
      setError(getSafeErrorMessage(err, 'Code invalide ou expiré. Veuillez réessayer.'));
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
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
      await authService.clerkExchange(freshToken);
      setResendMessage('Un nouveau code a été envoyé à votre adresse email.');
      setResendCooldown(RESEND_COOLDOWN);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(getSafeErrorMessage(err, "Impossible de renvoyer le code. Veuillez réessayer."));
    }
  }, [resendCooldown, getClerkToken]);

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
            background: 'linear-gradient(to bottom, rgba(34,34,34,0.15) 0%, rgba(34,34,34,0.6) 100%)',
            zIndex: 1,
          }}
        />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 6, zIndex: 2 }}>
          <FadeIn delay={0.2} direction="up">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Image src="/images/logo.png" alt="KeyHome — Vérification code OTP" width={42} height={42} />
              <Typography variant="h4" fontWeight={700} color="#fff">KeyHome</Typography>
            </Box>
          </FadeIn>
          <FadeIn delay={0.4} direction="up">
            <Typography variant="h5" color="rgba(255,255,255,0.9)" fontWeight={400} sx={{ maxWidth: 360 }}>
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
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 4 }}>
            <Image src="/images/logo.png" alt="KeyHome — Vérification code OTP" width={40} height={40} priority />
            <Typography variant="h5" fontWeight={700} color="primary.main">KeyHome</Typography>
          </Box>
        </FadeIn>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Compact OAuth flow progress */}
          <FadeIn delay={0.05} direction="none">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              {['Connexion', 'Vérification', 'Terminé'].map((label, idx) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: idx < 2 ? 1 : 'none' }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                  }}>
                    <Box sx={{
                      width: 22, height: 22, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: idx <= 1 ? 'primary.main' : 'grey.300',
                      color: idx <= 1 ? '#fff' : 'text.disabled',
                    }}>
                      {idx < 1 ? '✓' : idx + 1}
                    </Box>
                    <Typography variant="caption" fontWeight={idx === 1 ? 700 : 400} color={idx <= 1 ? 'text.primary' : 'text.disabled'}>
                      {label}
                    </Typography>
                  </Box>
                  {idx < 2 && (
                    <Box sx={{ flex: 1, height: 2, bgcolor: idx < 1 ? 'primary.main' : 'grey.300', borderRadius: 1 }} />
                  )}
                </Box>
              ))}
            </Box>
          </FadeIn>

          <FadeIn delay={0.1} direction="up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Code de vérification
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Saisissez le code à 6 chiffres envoyé à{' '}
              {emailHint ? (
                <Typography component="span" fontWeight={600} color="text.primary" variant="body2">
                  {emailHint}
                </Typography>
              ) : (
                'votre adresse email'
              )}.
            </Typography>
          </FadeIn>

          <FadeIn delay={0.2} direction="up">
            {/* form wrapper is required for iOS/Android SMS OTP autofill */}
            <Box
              component="form"
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
              autoComplete="on"
            >
              <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1.5 }, mb: 3 }}>
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    maxLength={1}
                    inputMode="numeric"
                    type="text"
                    // Only the FIRST box gets one-time-code — browsers/OS use it
                    // to detect an OTP field. Setting it on all 6 breaks autofill.
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      width: 'clamp(36px, 12vw, 56px)',
                      height: 'clamp(44px, 13vw, 64px)',
                      fontSize: 'clamp(18px, 5vw, 28px)',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: `2px solid ${digit ? '#F6475F' : '#e2e8f0'}`,
                      borderRadius: 10,
                      outline: 'none',
                      background: digit ? 'rgba(246,71,95,0.04)' : '#fff',
                      color: '#0f172a',
                      transition: 'border-color 0.15s, background 0.15s',
                      cursor: 'text',
                      boxSizing: 'border-box',
                    }}
                  />
                ))}
              </Box>

              {error && (
                <FadeIn direction="none" duration={0.3}>
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
                </FadeIn>
              )}
              {resendMessage && (
                <FadeIn direction="none" duration={0.3}>
                  <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{resendMessage}</Alert>
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
                    background: 'linear-gradient(to right, #F6475F, #D93A50)',
                    '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                    '&:active': { transform: 'scale(0.97)' },
                  }}
                >
                  {isSubmitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Vérifier le code'}
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
                  color: resendCooldown > 0 ? 'text.disabled' : 'primary.main',
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
