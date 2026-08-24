'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import FadeIn from '@/components/ui/layout/FadeIn';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { authService } from '@/services/auth.service';
import { gradient } from '@/theme/tokens';
import ArrowBack from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authService.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.push('/login');
    } catch (err) {
      setError(getSafeErrorMessage(err, 'Erreur lors de la réinitialisation.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 420 }}>
      <FadeIn direction="none">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
          <Image
            src="/images/logo.png"
            alt="KeyHome — Réinitialiser mot de passe"
            width={36}
            height={36}
            priority
          />
          <Typography variant="h6" fontWeight={700} color="primary.main">
            KeyHome
          </Typography>
        </Box>
      </FadeIn>

      <FadeIn delay={0.1} direction="up">
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Nouveau mot de passe
        </Typography>
      </FadeIn>

      {error && (
        <FadeIn direction="none" duration={0.3}>
          <AppAlert
            severity="error"
            id="reset-password-error"
            message={error}
            sx={{ mb: 2 }}
          />
        </FadeIn>
      )}

      <FadeIn delay={0.2} direction="up">
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nouveau mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            helperText="Minimum 8 caractères"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirmer"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={
              isSubmitting ||
              password.length < 8 ||
              password !== passwordConfirmation
            }
            sx={{
              py: 1.5,
              background: gradient.primary,
              '&:hover': { background: gradient.primaryHover },
              '&:active': { transform: 'scale(0.97)' },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} sx={{ color: '#fff' }} />
            ) : (
              'Réinitialiser'
            )}
          </Button>
        </Box>
      </FadeIn>

      <FadeIn delay={0.3} direction="up">
        <Box
          sx={{
            mt: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <IconButton
            href="/login"
            component={Link}
            size="small"
            aria-label="Retour à la connexion"
            sx={{
              bgcolor: 'rgba(0,0,0,0.05)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
              borderRadius: 1.5,
            }}
          >
            <ArrowBack sx={{ fontSize: 18 }} />
          </IconButton>
          <Link
            href="/login"
            underline="hover"
            sx={{ color: 'text.secondary', fontSize: '0.875rem' }}
          >
            Retour à la connexion
          </Link>
        </Box>
      </FadeIn>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3,
      }}
    >
      <Suspense fallback={<CircularProgress />}>
        <ResetPasswordForm />
      </Suspense>
    </Box>
  );
}
