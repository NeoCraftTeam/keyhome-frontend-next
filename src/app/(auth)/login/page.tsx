'use client';

import PasskeyLoginButton from '@/components/auth/PasskeyLoginButton';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { GoogleOneTap } from '@/components/auth/GoogleOneTap';
import TurnstileConfigAlert from '@/components/auth/TurnstileConfigAlert';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import FadeIn from '@/components/ui/FadeIn';
import { useLandingStats } from '@/hooks/useLandingStats';
import { useOutlinedInputLabelShrink } from '@/hooks/useOutlinedInputLabelShrink';
import { useTurnstileSiteKey } from '@/hooks/useTurnstileSiteKey';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { outlinedStartIconInputLabelProps } from '@/lib/mui-outlined-input-label-start-icon';
import { useAuth } from '@/providers/AuthProvider';
import { gradient } from '@/theme/tokens';
import EmailIcon from '@mui/icons-material/Email';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { AxiosError } from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { login } = useAuth();
  const { authStats } = useLandingStats();
  const router = useRouter();

  // Legacy Clerk org-task hash on client signInUrl — route to dedicated task page.
  useEffect(() => {
    if (window.location.hash.includes('choose-organization')) {
      router.replace('/choose-organization');
    }
  }, [router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileIssueCode, setTurnstileIssueCode] = useState<string | null>(
    null
  );
  const { siteKey: turnstileSiteKey, isResolved: turnstileConfigResolved } =
    useTurnstileSiteKey();
  const turnstileEnabled = Boolean(turnstileSiteKey);

  // Le bouton email/password est bloqué tant que Turnstile n'est pas résolu
  // ET que Turnstile est activé. Les boutons OAuth et passkey ne sont JAMAIS
  // bloqués par Turnstile — ils ont leur propre flux sans token CSRF.
  const emailPasswordReady =
    turnstileConfigResolved && (!turnstileEnabled || Boolean(turnstileToken));

  const emailLabelShrink = useOutlinedInputLabelShrink(email.length > 0);

  // Turnstile: env `NEXT_PUBLIC_TURNSTILE_SITE_KEY` *or* API `/config/turnstile` (see hook).

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTurnstileIssueCode(null);
    setIsSubmitting(true);

    try {
      await login(email, password, turnstileToken);
    } catch (err) {
      // If the backend says email is not verified, redirect to the OTP page.
      // The backend will have already re-sent a fresh OTP code.
      if (err instanceof AxiosError && err.response?.status === 403) {
        const data = err.response.data as {
          email_verification_required?: boolean;
          email?: string;
          role?: string;
        };
        if (data?.email_verification_required) {
          const verifiedEmail = data.email ?? email;
          const role = data.role ?? 'customer';
          const isOwner = role === 'agent' || role === 'admin';

          // Store session keys the OTP page expects.
          const emailKey = isOwner
            ? 'kh_verify_email_owner'
            : 'kh_verify_email_client';
          sessionStorage.setItem(emailKey, verifiedEmail);
          sessionStorage.setItem(
            'kh_register_role',
            isOwner ? 'agent' : 'customer'
          );

          router.push(isOwner ? '/owner/auth/verify-otp' : '/verify-email');
          return;
        }
      }
      setError(
        getSafeErrorMessage(err, 'Identifiants incorrects. Veuillez réessayer.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
          src="/images/01login.webp"
          alt="Bienvenue sur KeyHome"
          fill
          priority
          sizes="50vw"
          style={{ objectFit: 'cover' }}
        />
        {/* Dark overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(34,34,34,0.2) 0%, rgba(34,34,34,0.55) 100%)',
            zIndex: 1,
          }}
        />
        {/* Overlay text */}
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
                alt="KeyHome — Plateforme immobilière"
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
              Trouvez votre bien immobilier idéal
            </Typography>
          </FadeIn>
          <FadeIn delay={0.6} direction="up">
            <Box sx={{ mt: 3, display: 'flex', gap: 4 }}>
              {authStats.map((stat) => (
                <Box key={stat.label}>
                  <Typography variant="h5" fontWeight={700} color="#fff">
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.7)">
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
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
        }}
      >
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
              alt="KeyHome — Plateforme immobilière"
              width={40}
              height={40}
              priority
            />
            <Typography variant="h5" fontWeight={700} color="primary.main">
              KeyHome
            </Typography>
          </Box>
        </FadeIn>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <FadeIn delay={0.1} direction="up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Bienvenue
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Connectez-vous pour accéder à vos annonces
            </Typography>
          </FadeIn>

          {error && (
            <FadeIn direction="none" duration={0.3}>
              <Alert
                severity="error"
                id="login-error"
                sx={{ mb: 2, borderRadius: 2 }}
              >
                {error}
              </Alert>
            </FadeIn>
          )}

          <TurnstileConfigAlert code={turnstileIssueCode} />

          <FadeIn delay={0.2} direction="up">
            <Box
              component="form"
              onSubmit={handleSubmit}
              aria-describedby={error ? 'login-error' : undefined}
            >
              <TextField
                fullWidth
                label="Adresse email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={emailLabelShrink.onFocus}
                onBlur={emailLabelShrink.onBlur}
                required
                autoComplete="email"
                autoFocus
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon
                        sx={{ color: 'text.secondary', fontSize: 20 }}
                      />
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={outlinedStartIconInputLabelProps(
                  emailLabelShrink.shrink
                )}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        aria-label={
                          showPassword
                            ? 'Masquer le mot de passe'
                            : 'Afficher le mot de passe'
                        }
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />

              {turnstileEnabled && turnstileSiteKey && (
                <Box sx={{ mb: 2, minHeight: 65 }}>
                  <TurnstileWidget
                    siteKey={turnstileSiteKey}
                    action="login"
                    onToken={(t) => {
                      setTurnstileToken(t);
                      setTurnstileIssueCode(null);
                    }}
                    onExpire={() => setTurnstileToken(null)}
                    onErrorCode={(code) => {
                      setTurnstileToken(null);
                      setTurnstileIssueCode(code);
                    }}
                  />
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Link
                  href="/forgot-password"
                  underline="hover"
                  sx={{
                    fontSize: '0.8125rem',
                    color: 'primary.main',
                    fontWeight: 500,
                  }}
                >
                  Mot de passe oublié ?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting || !emailPasswordReady}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: (theme) =>
                    theme.palette.gradient?.primary ?? gradient.primary,
                  '&:hover': {
                    background: (theme) =>
                      theme.palette.gradient?.primaryHover ??
                      gradient.primaryHover,
                  },
                  transition:
                    'transform 0.15s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s',
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: '#fff' }} />
                ) : (
                  'Se connecter'
                )}
              </Button>
            </Box>
          </FadeIn>

          {/* OAuth et passkey : jamais bloqués par Turnstile — flux indépendant */}
          <FadeIn delay={0.3} direction="up">
            <SocialLoginButtons
              onError={(err) => setError(err)}
              disabled={false}
            />
          </FadeIn>

          <FadeIn delay={0.35} direction="up">
            <PasskeyLoginButton loginContext="client" />
          </FadeIn>

          <FadeIn delay={0.4} direction="up">
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 3, textAlign: 'center' }}
            >
              Pas encore de compte ?{' '}
              <Link
                href="/register?lock=1"
                underline="hover"
                sx={{ fontWeight: 600, color: 'primary.main' }}
              >
                Créer un compte
              </Link>
            </Typography>
          </FadeIn>

          {/* One Tap uniquement client — ne pas monter sur /owner/login (nouveaux comptes = particulier). */}
          <GoogleOneTap />

          <FadeIn delay={0.5} direction="up">
            <Divider sx={{ my: 2.5 }}>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ px: 1 }}
              >
                ou
              </Typography>
            </Divider>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center' }}
            >
              Vous êtes propriétaire ?{' '}
              <Link
                href="/owner/login"
                underline="hover"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                Accéder à l&apos;espace bailleur →
              </Link>
            </Typography>
          </FadeIn>
        </Box>
      </Box>
    </Box>
  );
}
