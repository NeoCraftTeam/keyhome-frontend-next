'use client';

import {
  ContentCopy as CopyIcon,
  Facebook as FacebookIcon,
  Share as ShareIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import {
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
} from '@mui/material';
import { useCallback, useState } from 'react';

interface ShareAdButtonsProps {
  adTitle: string;
  adUrl: string;
  size?: 'small' | 'medium';
}

export default function ShareAdButtons({ adTitle, adUrl, size = 'small' }: ShareAdButtonsProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${adUrl}`
    : adUrl;

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
  }, [fullUrl]);

  const handleWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`${adTitle} — ${fullUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }, [adTitle, fullUrl]);

  const handleFacebook = useCallback(() => {
    const url = encodeURIComponent(fullUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
  }, [fullUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({ title: adTitle, url: fullUrl });
    }
  }, [adTitle, fullUrl]);

  return (
    <>
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Partager sur WhatsApp">
          <IconButton size={size} onClick={handleWhatsApp} sx={{ color: '#25D366' }}>
            <WhatsAppIcon fontSize={size} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Partager sur Facebook">
          <IconButton size={size} onClick={handleFacebook} sx={{ color: '#1877F2' }}>
            <FacebookIcon fontSize={size} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Copier le lien">
          <IconButton size={size} onClick={handleCopyLink}>
            <CopyIcon fontSize={size} />
          </IconButton>
        </Tooltip>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Tooltip title="Partager">
            <IconButton size={size} onClick={handleNativeShare}>
              <ShareIcon fontSize={size} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Lien copié !"
      />
    </>
  );
}
