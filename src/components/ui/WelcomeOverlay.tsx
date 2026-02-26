'use client';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';

interface WelcomeOverlayProps {
  firstName?: string | null;
}

/** Celebratory full-screen overlay shown after registration / OAuth completion. */
export default function WelcomeOverlay({ firstName }: WelcomeOverlayProps) {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        bgcolor: '#0f0c29',
        animation: 'overlayIn 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        '@keyframes overlayIn': { from: { opacity: 0 }, to: { opacity: 1 } },

        /* purple→red sweep background */
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #8b1a2e 75%, #F6475F 100%)',
      }}
    >
      {/* Floating confetti dots */}
      {[...Array(18)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
            height: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
            borderRadius: '50%',
            bgcolor: [
              '#F6475F', '#ffffff', '#FFD700', '#ff9f43',
              '#48dbfb', '#ff6b6b', '#ffeaa7', '#a29bfe',
              '#fd79a8', '#55efc4', '#F6475F', '#ffffff',
              '#FFD700', '#ff9f43', '#48dbfb', '#ff6b6b',
              '#a29bfe', '#55efc4',
            ][i],
            top: `${Math.random() * 100}%`,
            left: `${5 + (i * 5.5) % 92}%`,
            opacity: 0,
            animation: `confettiFall ${1.8 + (i % 5) * 0.4}s ease-in ${0.3 + (i % 6) * 0.15}s infinite`,
            '@keyframes confettiFall': {
              '0%': { opacity: 0, transform: 'translateY(-60px) rotate(0deg)' },
              '20%': { opacity: 0.9 },
              '80%': { opacity: 0.7 },
              '100%': { opacity: 0, transform: 'translateY(80px) rotate(720deg)' },
            },
          }}
        />
      ))}

      {/* Glow ring behind logo */}
      <Box
        sx={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          position: 'absolute',
          bgcolor: 'rgba(246,71,95,0.25)',
          filter: 'blur(32px)',
          animation: 'pulse 2s ease-in-out 0.4s infinite',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1)', opacity: 0.6 },
            '50%': { transform: 'scale(1.25)', opacity: 1 },
          },
        }}
      />

      {/* Content */}
      <Box
        sx={{
          textAlign: 'center',
          px: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo with bounce-in */}
        <Box
          sx={{
            mb: 3,
            animation: 'bounceIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both',
            '@keyframes bounceIn': {
              '0%': { opacity: 0, transform: 'scale(0.3)' },
              '60%': { transform: 'scale(1.1)' },
              '80%': { transform: 'scale(0.95)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
            }}
          >
            <Image src="/images/logo.png" alt="KeyHome" width={60} height={60} />
          </Box>
        </Box>

        {/* Headline */}
        <Box
          sx={{
            animation: 'slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.55s both',
            '@keyframes slideUp': {
              from: { opacity: 0, transform: 'translateY(24px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Typography
            variant="h2"
            fontWeight={800}
            color="#fff"
            sx={{
              fontSize: { xs: '2rem', sm: '2.75rem' },
              letterSpacing: -1,
              mb: 1,
              textShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            Bienvenue{firstName ? `, ${firstName}` : ''} !
          </Typography>
          <Typography
            variant="h5"
            fontWeight={400}
            sx={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: { xs: '1rem', sm: '1.25rem' },
              maxWidth: 420,
              mx: 'auto',
              lineHeight: 1.5,
            }}
          >
            Votre chez-vous vous attend sur KeyHome.
          </Typography>
        </Box>

        {/* Tagline */}
        <Box
          sx={{
            animation: 'slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.85s both',
            '@keyframes slideUp': {
              from: { opacity: 0, transform: 'translateY(24px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            mt: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.7rem' }}
          >
            Préparez‑vous à découvrir votre logement idéal
          </Typography>
        </Box>

        {/* Animated dots loader */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'center',
            mt: 5,
            animation: 'fadeInDots 0.6s ease 1.1s both',
            '@keyframes fadeInDots': { from: { opacity: 0 }, to: { opacity: 1 } },
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.7)',
                animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                '@keyframes dotBounce': {
                  '0%, 80%, 100%': { transform: 'scale(0.7)', opacity: 0.5 },
                  '40%': { transform: 'scale(1.2)', opacity: 1 },
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
