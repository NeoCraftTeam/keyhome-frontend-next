'use client';

import FadeIn from '@/components/ui/FadeIn';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { useSignUp } from '@clerk/nextjs';
import { ArrowBack, Phone as PhoneIcon } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const { signUp, setActive } = useSignUp();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const result = await authService.completeClerkProfile({ phone_number: phoneNumber });
      sessionStorage.removeItem('clerk_auth_prefill');
      finalizeAuth(result.token, result.user, result.panel_sso_url);
    } catch (err) {
      setError(getSafeErrorMessage(err, 'Une erreur est survenue. Veuillez réessayer.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Clerk native sign-up flow ─────────────────────────────────────────────────────

  const missingPhone = signUp?.missingFields?.includes('phone_number') ?? false;

  const handleClerkFlowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await signUp.update({
        ...(missingPhone ? { phoneNumber } : {}),
      });

      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId! });
        router.replace('/home');
      } else {
        setError('Des informations supplémentaires sont requises. Veuillez réessayer.');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
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

  const showPhoneField = isOtpFlow || missingPhone;
  const handleSubmit = isOtpFlow ? handleOtpFlowSubmit : handleClerkFlowSubmit;

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
          src="/images/04Final.jpg"
          alt="Complétez votre profil KeyHome"
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
              <Image src="/images/logo.png" alt="KeyHome" width={42} height={42} />
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
            <Image src="/images/logo.png" alt="KeyHome" width={40} height={40} priority />
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
                <TextField
                  label="Numéro de téléphone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  required
                  fullWidth
                  autoFocus
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting || (showPhoneField && phoneNumber.trim().length < 8)}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(to right, #F6475F, #D93A50)',
                  '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
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
