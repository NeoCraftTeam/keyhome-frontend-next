'use client';

import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import FadeIn from '@/components/ui/FadeIn';
import { useOutlinedInputLabelShrink } from '@/hooks/useOutlinedInputLabelShrink';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { outlinedStartIconInputLabelProps } from '@/lib/mui-outlined-input-label-start-icon';
import { OWNER_LOGIN_HERO_SRC, OWNER_LOGO_SRC } from '@/lib/owner-auth-assets';
import { useAuth } from '@/providers/AuthProvider';
import {
  Email as EmailIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
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
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@/types';

export default function OwnerLoginPage() {
  const { loginOwner, user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect already-authenticated owners away from the login page
  useEffect(() => {
    if (isLoading) return;
    if (
      isAuthenticated &&
      user &&
      (user.role === UserRole.AGENT || user.role === UserRole.ADMIN)
    ) {
      const redirect =
        sessionStorage.getItem('kh_owner_redirect') || '/owner/dashboard';
      sessionStorage.removeItem('kh_owner_redirect');
      router.replace(redirect);
    }
  }, [isAuthenticated, isLoading, user, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailLabelShrink = useOutlinedInputLabelShrink(email.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await loginOwner(email, password);
    } catch (err) {
      setError(
        getSafeErrorMessage(
          err,
          'Identifiants incorrects. Veuillez réessayer ou créez un compte bailleur.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', minHeight: '100vh' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Image
          src={OWNER_LOGIN_HERO_SRC}
          alt="Bienvenue sur KeyHome — espace bailleur"
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
              'linear-gradient(to bottom, rgba(13,148,136,0.2) 0%, rgba(13,148,136,0.55) 100%)',
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
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6 },
          bgcolor: 'background.paper',
        }}
      >
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

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <FadeIn delay={0.1} direction="up">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Connexion propriétaire
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Connectez-vous pour accéder à votre espace bailleur
            </Typography>
          </FadeIn>

          {error && (
            <FadeIn direction="none" duration={0.3}>
              <Alert
                severity="error"
                id="owner-login-error"
                sx={{ mb: 2, borderRadius: 2 }}
              >
                {error}
              </Alert>
            </FadeIn>
          )}

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

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
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
                disabled={isSubmitting}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
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

          <FadeIn delay={0.4} direction="up">
            <SocialLoginButtons
              registrationIntent="agent"
              onError={setError}
              showDivider
              providers={['google', 'facebook', 'apple']}
            />
          </FadeIn>

          <FadeIn delay={0.5} direction="up">
            <Divider sx={{ my: 2.5 }}>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ px: 1 }}
              ></Typography>
            </Divider>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, textAlign: 'center' }}
            >
              Pas encore de compte ?{' '}
              <Link
                href="/owner/register"
                underline="hover"
                sx={{ fontWeight: 600, color: 'primary.main' }}
              >
                Créer un compte bailleur
              </Link>
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1.5, textAlign: 'center' }}
            >
              Vous êtes locataire ?{' '}
              <Link
                href="/login"
                underline="hover"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                Accéder à l&apos;espace client →
              </Link>
            </Typography>
          </FadeIn>
        </Box>
      </Box>
    </Box>
  );
}
