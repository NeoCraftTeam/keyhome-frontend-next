'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Box, Button, Typography, Alert, CircularProgress, Link } from '@mui/material';
import { MarkEmailRead as MailIcon } from '@mui/icons-material';
import { authService } from '@/services/auth.service';
import { AxiosError } from 'axios';
import FadeIn from '@/components/ui/FadeIn';

export default function VerifyEmailPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResend = async () => {
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await authService.resendVerification();
      setMessage(res.message || 'Email de vérification renvoyé avec succès.');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr?.response?.data?.message || 'Erreur lors du renvoi.');
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
      <Box sx={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <FadeIn direction="none">
          <Box sx={{ mb: 2 }}>
            <Image src="/images/logo.png" alt="KeyHome" width={48} height={48} priority />
          </Box>
        </FadeIn>

        <FadeIn delay={0.1} direction="up">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}
          >
            <MailIcon sx={{ color: '#fff', fontSize: 40 }} />
          </Box>
        </FadeIn>

        <FadeIn delay={0.2} direction="up">
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Vérifiez votre email
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Nous vous avons envoyé un lien de vérification. Consultez votre boîte de réception (et les
            spams) pour activer votre compte.
          </Typography>
        </FadeIn>

        {error && (
          <FadeIn direction="none" duration={0.3}>
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          </FadeIn>
        )}
        {message && (
          <FadeIn direction="none" duration={0.3}>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{message}</Alert>
          </FadeIn>
        )}

        <FadeIn delay={0.3} direction="up">
          <Button
            onClick={handleResend}
            variant="outlined"
            size="large"
            disabled={isSubmitting}
            sx={{ borderRadius: 2, mb: 2 }}
          >
            {isSubmitting ? <CircularProgress size={20} /> : 'Renvoyer le mail'}
          </Button>

          <Box>
            <Link href="/login" underline="hover" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              Retour à la connexion
            </Link>
          </Box>
        </FadeIn>
      </Box>
    </Box>
  );
}
