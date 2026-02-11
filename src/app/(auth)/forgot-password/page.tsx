'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AxiosError } from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { authService } from '@/services/auth.service';
import FadeIn from '@/components/ui/FadeIn';

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
      setSuccess(res.message || 'Un lien de réinitialisation a été envoyé à votre adresse email.');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr?.response?.data?.message || 'Erreur lors de l\'envoi du lien.');
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
            <Image src="/images/logo.png" alt="KeyHome" width={36} height={36} priority />
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
            Saisissez votre email et nous vous enverrons un lien de réinitialisation.
          </Typography>
        </FadeIn>

        {error && (
          <FadeIn direction="none" duration={0.3}>
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          </FadeIn>
        )}
        {success && (
          <FadeIn direction="none" duration={0.3}>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>
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
                borderRadius: 2,
                background: 'linear-gradient(to right, #F6475F, #D93A50)',
                '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
              }}
            >
              {isSubmitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Envoyer le lien'}
            </Button>
          </Box>
        </FadeIn>

        <FadeIn delay={0.3} direction="up">
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link
              href="/login"
              underline="hover"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}
            >
              <ArrowBack sx={{ fontSize: 16 }} /> Retour à la connexion
            </Link>
          </Box>
        </FadeIn>
      </Box>
    </Box>
  );
}
