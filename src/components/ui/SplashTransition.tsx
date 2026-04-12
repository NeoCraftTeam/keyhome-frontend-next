'use client';

import { Box, LinearProgress } from '@mui/material';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface SplashTransitionProps {
  /** Duration in milliseconds. Default: 1400ms */
  duration?: number;
  onComplete: () => void;
}

/**
 * Premium splash screen shown between the landing page and the auth pages.
 * Displays the KeyHome logo with a spring animation and a progress bar.
 * Calls `onComplete` once both the animation finishes AND the minimum
 * duration has elapsed.
 */
export default function SplashTransition({
  duration = 1400,
  onComplete,
}: SplashTransitionProps) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    const startTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        // Start fade-out, then notify parent
        setFading(true);
        setTimeout(() => {
          if (!calledRef.current) {
            calledRef.current = true;
            onComplete();
          }
        }, 350);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, onComplete]);

  return (
    <Box
      aria-live="polite"
      aria-label="Chargement de l'application"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.35s ease',
        pointerEvents: fading ? 'none' : 'auto',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
      }}
    >
      {/* Logo — spring scale in */}
      <Box
        sx={{
          animation: 'kh-splash-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
          '@keyframes kh-splash-in': {
            '0%': { opacity: 0, transform: 'scale(0.55)' },
            '100%': { opacity: 1, transform: 'scale(1)' },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }}
      >
        <Image
          src="/images/logo.png"
          alt="KeyHome"
          width={72}
          height={72}
          priority
          style={{ objectFit: 'contain' }}
        />
      </Box>

      {/* Brand name */}
      <Box
        component="span"
        sx={{
          mt: 1.5,
          fontSize: '1.375rem',
          fontWeight: 900,
          letterSpacing: '-0.5px',
          color: 'primary.main',
          animation: 'kh-fade-up 0.45s ease 0.2s both',
          '@keyframes kh-fade-up': {
            '0%': { opacity: 0, transform: 'translateY(8px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }}
      >
        KeyHome
      </Box>

      {/* Progress bar */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3,
            borderRadius: 0,
            backgroundColor: 'transparent',
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'primary.main',
              transition: 'none', // driven by RAF, no CSS transition needed
            },
          }}
        />
      </Box>
    </Box>
  );
}
