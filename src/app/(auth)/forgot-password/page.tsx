'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import FadeIn from '@/components/ui/layout/FadeIn';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { authService } from '@/services/auth.service';
import { brand } from '@/theme/tokens';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { Box, Button, Link, TextField, Typography } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await authService.forgotPassword(email);
      setSuccess(
        res.message ||
          'Un lien de réinitialisation a été envoyé à votre adresse email.'
      );
    } catch (err) {
      setError(getSafeErrorMessage(err, "Erreur lors de l'envoi du lien."));
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <FadeIn direction="none">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
            <Image
              src="/images/logo.png"
              alt="KeyHome — Mot de passe oublié"
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
            Mot de passe oublié
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Saisissez votre email et nous vous enverrons un lien de
            réinitialisation.
          </Typography>
        </FadeIn>

        {error && (
          <FadeIn direction="none" duration={0.3}>
            <AppAlert
              severity="error"
              id="forgot-password-error"
              message={error}
              sx={{ mb: 2 }}
            />
          </FadeIn>
        )}
        {success && (
          <FadeIn direction="none" duration={0.3}>
            <AppAlert severity="success" message={success} sx={{ mb: 2 }} />
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
              required
              autoFocus
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || !email.trim()}
              sx={{
                py: 1.5,
                background: brand.primary,
                '&:hover': { background: brand.primaryHover },
                '&:active': { transform: 'scale(0.97)' },
              }}
            >
              {isSubmitting ? (
                <ButtonSpinner size={24} color="#fff" />
              ) : (
                'Envoyer le lien'
              )}
            </Button>
          </Box>
        </FadeIn>

        <FadeIn delay={0.3} direction="up">
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link
              href="/login"
              underline="hover"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'text.secondary',
                fontSize: '0.875rem',
              }}
            >
              <ArrowBack sx={{ fontSize: 16 }} /> Retour à la connexion
            </Link>
          </Box>
        </FadeIn>
      </Box>
    </Box>
  );
}
