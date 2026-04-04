'use client';

import PurchaseCreditsModal from '@/components/ui/PurchaseCreditsModal';
import { useAuth } from '@/providers/AuthProvider';
import { creditsService } from '@/services/credits.service';
import Toll from '@mui/icons-material/Toll';
import { Box, Skeleton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/**
 * Pill badge in the Navbar showing the user's credit balance.
 *
 * Bouncing animation logic:
 * - Activates immediately on first login (`onboarding_completed_at === null`).
 * - Persists (keeps bouncing) until the user clicks the badge.
 * - Never reappears on subsequent logins (tracked via localStorage).
 */
export default function CreditsWidget() {
  const { user, isAuthenticated } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [bouncing, setBouncing] = useState(false);

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['credits-balance'],
    queryFn: () => creditsService.getBalance(),
    refetchInterval: (query) =>
      query.state.status === 'error' ? false : 30_000,
    staleTime: 15_000,
    enabled: isAuthenticated,
    retry: false,
  });

  // Determine if we should bounce on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !user) {
      return;
    }

    // Already interacted with the badge in a previous session
    if (localStorage.getItem('kh_credits_bounce_done')) {
      return;
    }

    // First-login user: onboarding not yet completed → bounce immediately
    if (user.onboarding_completed_at == null) {
      setBouncing(true);
      return;
    }

    // Edge case: onboarding just completed this session (page nav after dismissing WelcomeModal)
    // but the badge wasn't clicked yet — keep bouncing
    // We use sessionStorage to track "bounce started this session"
    if (sessionStorage.getItem('kh_credits_bouncing')) {
      setBouncing(true);
    }
  }, [user]);

  // Also start bouncing when WelcomeModal is dismissed mid-session
  useEffect(() => {
    const handler = () => {
      setBouncing(true);
      sessionStorage.setItem('kh_credits_bouncing', '1');
    };
    window.addEventListener('kh:welcome-dismissed', handler);
    return () => window.removeEventListener('kh:welcome-dismissed', handler);
  }, []);

  const handleClick = () => {
    // Stop bouncing permanently
    if (bouncing) {
      setBouncing(false);
      localStorage.setItem('kh_credits_bounce_done', '1');
      sessionStorage.removeItem('kh_credits_bouncing');
    }
    setModalOpen(true);
  };

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.6,
          background: bouncing
            ? 'linear-gradient(135deg, rgba(246,71,95,0.25) 0%, rgba(246,71,95,0.15) 100%)'
            : 'linear-gradient(135deg, rgba(246,71,95,0.12) 0%, rgba(246,71,95,0.06) 100%)',
          border: '1px solid',
          borderColor: bouncing ? 'primary.main' : 'rgba(246,71,95,0.25)',
          borderRadius: '40px',
          px: 1.5,
          py: 0.55,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.18s',
          ...(bouncing && {
            animation:
              'creditsBounce 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite alternate, creditsGlow 1.5s ease-in-out infinite',
            '@keyframes creditsBounce': {
              '0%': { transform: 'translateY(0) scale(1)' },
              '100%': { transform: 'translateY(-4px) scale(1.08)' },
            },
            '@keyframes creditsGlow': {
              '0%, 100%': { boxShadow: '0 0 0 0 rgba(246,71,95,0.3)' },
              '50%': { boxShadow: '0 0 12px 4px rgba(246,71,95,0.35)' },
            },
          }),
          '&:hover': {
            background:
              'linear-gradient(135deg, rgba(246,71,95,0.2) 0%, rgba(246,71,95,0.12) 100%)',
            borderColor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(246,71,95,0.12)',
          },
        }}
      >
        <Toll sx={{ fontSize: 15, color: 'primary.main' }} />
        {balanceLoading ? (
          <Skeleton width={28} height={14} sx={{ borderRadius: 1 }} />
        ) : (
          <Typography
            variant="body2"
            fontWeight={800}
            sx={{
              color: 'primary.main',
              lineHeight: 1,
              letterSpacing: -0.3,
              fontSize: '0.82rem',
            }}
          >
            {(balance ?? 0).toLocaleString('fr-FR')}
          </Typography>
        )}
      </Box>

      <PurchaseCreditsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
