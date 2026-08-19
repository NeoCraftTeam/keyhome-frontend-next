'use client';

import { captureReturnTo } from '@/lib/auth/return-to';
import { findOrCreateConversation } from '@/lib/chat/chat-api';
import { ensureCsrfCookie, resetCsrfState } from '@/lib/api';
import { getSafeErrorMessage } from '@/lib/error-messages';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { isAxiosError } from 'axios';

interface ContactChatButtonProps {
  adId: string;
  isLocked: boolean;
  isOwnAd: boolean;
  isAuthenticated: boolean;
  onUnlockClick: () => void;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  /** Title of the ad — used to build the predefined opening message. */
  adTitle?: string;
  /** Transaction type — drives the wording of the predefined message. */
  transactionType?: 'location' | 'vente' | null;
  /** Slug of the ad — appended as a link in the first message. */
  adSlug?: string;
  /** Host first name — personalises the CTA and opening line of the draft. */
  hostFirstName?: string;
}

export function buildDraftMessage(
  adTitle: string | undefined,
  transactionType: 'location' | 'vente' | null | undefined,
  adUrl?: string,
  hostFirstName?: string
): string {
  const greet =
    hostFirstName && hostFirstName.length > 0
      ? `Bonjour ${hostFirstName},`
      : 'Bonjour,';
  const title = adTitle ? `«\u202f${adTitle}\u202f»` : 'votre annonce';
  const base = `${greet} je suis intéressé(e) par ${title}.`;

  let msg: string;
  if (transactionType === 'location') {
    msg = `${base} J'aimerais avoir les modalités de location et, si possible, convenir d'une date pour une visite.`;
  } else if (transactionType === 'vente') {
    msg = `${base} J'aimerais avoir plus d'informations sur les modalités de vente et, si possible, convenir d'une date pour une visite.`;
  } else {
    msg = `${base} J'aimerais avoir plus d'informations et, si possible, convenir d'une date pour une visite.`;
  }

  if (adUrl) msg += `\n\n${adUrl}`;
  return msg;
}

/** Detect transient axios failures that deserve an automatic retry. */
function isRetryableAxiosError(e: unknown): boolean {
  if (!isAxiosError(e)) return false;
  // Network or timeout (no response received)
  if (!e.response) {
    const code = e.code ?? '';
    return (
      code === 'ECONNABORTED' || code === 'ERR_NETWORK' || code === 'ETIMEDOUT'
    );
  }
  const status = e.response.status;
  // CSRF token expired (419) or transient infra (502/503/504): one retry helps.
  return status === 419 || status === 502 || status === 503 || status === 504;
}

/**
 * Chat CTA on ad detail pages.
 *
 * States:
 *  - Own ad          → renders nothing
 *  - Not logged in   → redirects to /login
 *  - Locked ad       → triggers the unlock/payment dialog
 *  - Unlocked        → POST /conversations then navigates to /messages/[uuid]?draft=…
 *
 * Resilience:
 *  - 403 from the backend (ad not yet unlocked according to server state) →
 *    open the unlock dialog instead of showing a dead-end error.
 *  - Transient errors (419 CSRF, 502/503/504, network/timeout) are retried
 *    once automatically after refreshing the CSRF cookie.
 *  - Any other error surfaces the actual backend message + a "Réessayer"
 *    button so the user is never stuck with a generic dead-end.
 */
export default function ContactChatButton({
  adId,
  isLocked,
  isOwnAd,
  isAuthenticated,
  onUnlockClick,
  fullWidth = true,
  size = 'large',
  adTitle,
  transactionType,
  adSlug,
  hostFirstName,
}: ContactChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const performOpen = useCallback(async () => {
    const { conversation } = await findOrCreateConversation(adId);
    const adUrl = adSlug
      ? `${window.location.origin}/ads/${adSlug}`
      : undefined;
    const draft = buildDraftMessage(
      adTitle,
      transactionType,
      adUrl,
      hostFirstName
    );
    router.push(
      `/messages/${conversation.uuid}?draft=${encodeURIComponent(draft)}`
    );
  }, [adId, adSlug, adTitle, transactionType, hostFirstName, router]);

  const handleClick = useCallback(async () => {
    if (!isAuthenticated) {
      captureReturnTo('client');
      router.push('/login');
      return;
    }

    if (isLocked) {
      onUnlockClick();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await performOpen();
    } catch (firstErr) {
      // Console log so users can paste it in DevTools if support asks.
      if (process.env.NODE_ENV !== 'production') {
        console.error('[ContactChatButton] First attempt failed:', firstErr);
      }

      // Retry once for transient infra / CSRF
      if (isRetryableAxiosError(firstErr)) {
        try {
          resetCsrfState();
          await ensureCsrfCookie();
          await performOpen();
          return; // success after retry
        } catch (retryErr) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[ContactChatButton] Retry failed:', retryErr);
          }

          if (isAxiosError(retryErr) && retryErr.response?.status === 403) {
            setLoading(false);
            onUnlockClick();
            return;
          }
          setError(
            getSafeErrorMessage(
              retryErr,
              "Impossible d'ouvrir la conversation. Veuillez réessayer."
            )
          );
          setLoading(false);
          return;
        }
      }

      // Non-retryable failure paths
      if (isAxiosError(firstErr) && firstErr.response?.status === 403) {
        setLoading(false);
        onUnlockClick();
        return;
      }
      setError(
        getSafeErrorMessage(
          firstErr,
          "Impossible d'ouvrir la conversation. Veuillez réessayer."
        )
      );
      setLoading(false);
    }
  }, [isAuthenticated, isLocked, onUnlockClick, performOpen, router]);

  if (isOwnAd) return null;

  const chatLabel = hostFirstName
    ? `Échanger avec ${hostFirstName}`
    : "Échanger avec l'hôte";

  return (
    <>
      <Button
        fullWidth={fullWidth}
        variant="contained"
        size={size}
        onClick={() => void handleClick()}
        disabled={loading}
        startIcon={
          loading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <ChatBubbleOutlineIcon />
          )
        }
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 2.5,
          bgcolor: '#F6475F',
          '&:hover': { bgcolor: '#e03050' },
          '&:active': { transform: 'scale(0.97)' },
        }}
      >
        {loading
          ? 'Ouverture…'
          : isLocked
            ? 'Débloquez pour contacter'
            : chatLabel}
      </Button>
      {error && (
        <Box
          sx={{
            mt: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box
            component="p"
            sx={{ color: '#e03050', fontSize: '0.75rem', m: 0, flex: 1 }}
          >
            {error}
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={() => void handleClick()}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              minWidth: 0,
              borderColor: '#e03050',
              color: '#e03050',
              '&:hover': {
                borderColor: '#c01030',
                bgcolor: 'rgba(224,48,80,0.06)',
              },
            }}
          >
            Réessayer
          </Button>
        </Box>
      )}
    </>
  );
}
