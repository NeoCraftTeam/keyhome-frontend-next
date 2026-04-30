'use client';

import { findOrCreateConversation } from '@/lib/chat-api';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { Button, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  /** Slug of the ad — appended as a clickable link in the first message. */
  adSlug?: string;
}

export function buildDraftMessage(
  adTitle: string | undefined,
  transactionType: 'location' | 'vente' | null | undefined,
  adUrl?: string
): string {
  const title = adTitle ? `«\u202f${adTitle}\u202f»` : 'votre annonce';
  const base = `Bonjour, je suis intéressé(e) par ${title}.`;

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

/**
 * Chat CTA on ad detail pages.
 *
 * States:
 *  - Own ad          → renders nothing
 *  - Not logged in   → redirects to /login
 *  - Locked ad       → triggers the unlock/payment dialog
 *  - Unlocked        → POST /conversations then navigates to /messages/[uuid]?draft=…
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
}: ContactChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isOwnAd) return null;

  const handleClick = async () => {
    if (!isAuthenticated) {
      sessionStorage.setItem(
        'kh_redirect_after_login',
        window.location.pathname + window.location.search
      );
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
      const { conversation } = await findOrCreateConversation(adId);
      const adUrl = adSlug
        ? `${window.location.origin}/ads/${adSlug}`
        : undefined;
      const draft = buildDraftMessage(adTitle, transactionType, adUrl);
      router.push(
        `/messages/${conversation.uuid}?draft=${encodeURIComponent(draft)}`
      );
    } catch {
      setError("Impossible d'ouvrir la conversation. Veuillez réessayer.");
      setLoading(false);
    }
  };

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
            ? 'Débloquez pour envoyer un message'
            : 'Envoyer un message'}
      </Button>
      {error && (
        <p style={{ color: '#e03050', fontSize: '0.75rem', marginTop: 4 }}>
          {error}
        </p>
      )}
    </>
  );
}
