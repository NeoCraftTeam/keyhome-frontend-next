'use client';

import PasskeyLoginButton from '@/components/auth/PasskeyLoginButton';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import TurnstileConfigAlert from '@/components/auth/TurnstileConfigAlert';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import FadeIn from '@/components/ui/layout/FadeIn';
import { useOutlinedInputLabelShrink } from '@/hooks/useOutlinedInputLabelShrink';
import { useTurnstileEmailSubmitReady } from '@/hooks/useTurnstileEmailSubmitReady';
import {
  AUTH_PANEL_UNAVAILABLE_MESSAGE,
  getAuthApiErrorMessage,
} from '@/lib/auth/auth-api-errors';
import { setRoleCookie } from '@/lib/auth/auth-session';
import {
  extractMfaChallenge,
  mfaChallengePathFor,
  rememberMfaChallenge,
} from '@/lib/auth/mfa-challenge';
import {
  adoptReturnToFromQuery,
  consumeReturnTo,
  RETURN_TO_PARAM,
} from '@/lib/auth/return-to';
import { outlinedStartIconInputLabelProps } from '@/lib/mui-outlined-input-label-start-icon';
import {
  OWNER_LOGIN_HERO_SRC,
  OWNER_LOGO_SRC,
} from '@/lib/owner/owner-auth-assets';
import { useAuth } from '@/providers/AuthProvider';
import { brandAgent, neutral } from '@/theme/tokens';
import { UserRole } from '@/types';
import EmailIcon from '@mui/icons-material/Email';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AxiosError } from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OwnerLoginPage() {
  const { loginOwner, user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('kh_owner_admin_panel_hint') === '1') {
      sessionStorage.removeItem('kh_owner_admin_panel_hint');
      setError(AUTH_PANEL_UNAVAILABLE_MESSAGE);
    }

    // `?redirect=` survives the OAuth round-trip only once persisted.
    adoptReturnToFromQuery(
      'owner',
      new URLSearchParams(window.location.search).get(RETURN_TO_PARAM)
    );
  }, []);

  // Redirect already-authenticated agents away from the login page
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user?.role === UserRole.AGENT) {
      setRoleCookie(user.role);
      router.replace(consumeReturnTo('owner'));
    }
  }, [isAuthenticated, isLoading, user, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileIssueCode, setTurnstileIssueCode] = useState<string | null>(
    null
  );
  const {
    siteKey: turnstileSiteKey,
    turnstileEnabled,
    emailPasswordReady,
  } = useTurnstileEmailSubmitReady(turnstileToken);

  const emailLabelShrink = useOutlinedInputLabelShrink(email.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTurnstileIssueCode(null);
    setIsSubmitting(true);

    try {
      await loginOwner(email, password, turnstileToken);
    } catch (err) {
      // 2FA enabled on this account: the API withholds the token and hands us a
      // short-lived ticket instead. Kept in memory only — see `mfa-challenge`.
      const mfaChallenge = extractMfaChallenge(err);

      if (mfaChallenge) {
        rememberMfaChallenge(mfaChallenge, 'owner');
        router.push(mfaChallengePathFor('owner'));

        return;
      }

      // Unverified email → redirect to OTP page (backend already re-sent a fresh code).
      if (err instanceof AxiosError && err.response?.status === 403) {
        const data = err.response.data as {
          email_verification_required?: boolean;
          email?: string;
        };
        if (data?.email_verification_required) {
          const verifiedEmail = data.email ?? email;
          sessionStorage.setItem('kh_verify_email_owner', verifiedEmail);
          sessionStorage.setItem('kh_register_role', 'agent');
          router.push('/owner/auth/verify-otp');
          return;
        }
      }
      setError(getAuthApiErrorMessage(err, 'login'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        // Ancrée dans l'écran : la page de connexion ne scrolle jamais.
        // `dvh` suit la barre d'outils mobile (contrairement à `vh`).
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `url(${OWNER_LOGIN_HERO_SRC})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, ${brandAgent.primaryAlpha20} 0%, ${brandAgent.primaryAlpha25} 100%)`,
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
                alt="KeyHome — Plateforme immobilière"
                width={42}
                height={42}
              />
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: neutral.white }}
              >
                KeyHome
              </Typography>
            </Box>
          </FadeIn>
          <FadeIn delay={0.4} direction="up">
            <Typography
              variant="h5"
              fontWeight={400}
              sx={{
                maxWidth: 360,
                color: alpha(neutral.white, 0.9),
              }}
            >
              Espace propriétaire — gérez vos annonces
            </Typography>
          </FadeIn>
        </Box>
      </Box>

      <Box
        sx={{
          flex: { xs: 1, md: '0 0 480px' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { xs: 3, sm: 6 },
          py: { xs: 2.5, sm: 3.5 },
          bgcolor: 'background.paper',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Zone centrale : centrée verticalement, et seule à défiler si l'écran
            est vraiment trop court (clavier mobile, fenêtre réduite) — le pied
            de page reste ancré. */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            display: 'flex',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 3,
              bgcolor: 'divider',
            },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 400, m: 'auto', py: 0.5 }}>
            <FadeIn direction="none">
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 3,
                }}
              >
                <Image
                  src={OWNER_LOGO_SRC}
                  alt="KeyHome — Panneau propriétaire"
                  width={40}
                  height={40}
                  priority
                />
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  KeyHome Owner
                </Typography>
              </Box>
            </FadeIn>
            <FadeIn delay={0.1} direction="up">
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Connexion propriétaire
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2.5 }}
              >
                Connectez-vous pour accéder à votre espace bailleur
              </Typography>
            </FadeIn>

            {error && (
              <FadeIn direction="none" duration={0.3}>
                <AppAlert
                  severity="error"
                  id="owner-login-error"
                  message={error}
                  sx={{ mb: 2 }}
                />
              </FadeIn>
            )}

            <TurnstileConfigAlert code={turnstileIssueCode} />

            <FadeIn delay={0.2} direction="up">
              <Box component="form" onSubmit={handleSubmit}>
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
                      action="login-owner"
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

                <Box
                  sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}
                >
                  <Link
                    href="/owner/forgot-password"
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
                  disabled={Boolean(isSubmitting || !emailPasswordReady)}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:active': { transform: 'scale(0.97)' },
                    '&.Mui-disabled': {
                      bgcolor: 'primary.main',
                      color: '#fff',
                      opacity: 0.65,
                    },
                  }}
                >
                  {isSubmitting ? <ButtonSpinner size={24} /> : 'Se connecter'}
                </Button>
              </Box>
            </FadeIn>

            {/* Toutes les méthodes OAuth affichées directement (aligné sur le panel client) */}
            <FadeIn delay={0.4} direction="up">
              <SocialLoginButtons
                registrationIntent="agent"
                onError={setError}
                showDivider
                disabled={false}
                dense
              />
            </FadeIn>

            {/* Connexion par passkey (WebAuthn) — visible d'emblée, plus de section repliée */}
            <FadeIn delay={0.45} direction="up">
              <PasskeyLoginButton loginContext="owner" dense />
            </FadeIn>
          </Box>
        </Box>

        {/* Pied de page ancré au bas de l'écran — ne défile pas avec le formulaire. */}
        <Box
          sx={{
            flexShrink: 0,
            width: '100%',
            maxWidth: 400,
            pt: 2,
            mt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Pas encore de compte ?{' '}
            <Link
              href="/owner/register"
              underline="hover"
              sx={{ fontWeight: 600, color: 'primary.main' }}
            >
              Créer un compte bailleur
            </Link>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vous êtes locataire ?{' '}
            <Link
              href="/login"
              underline="hover"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              Accéder à l&apos;espace client →
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
