'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { ownerService } from '@/services/owner.service';
import { brandAgent, neutral } from '@/theme/tokens';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function AdPlacardePreviewPage() {
  const params = useParams<{ id: string }>();
  const adId = params?.id ?? '';

  const [html, setHtml] = useState<string | null>(null);
  const [filename, setFilename] = useState('placarde-keyhome.pdf');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Pancarte KeyHome';
  }, []);

  useEffect(() => {
    if (!adId) {
      setError('Annonce introuvable.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const markup = await ownerService.fetchAdPlacardePreviewHtml(adId, {
          signal: controller.signal,
        });
        setHtml(markup);
        setFilename(`placarde-${adId.slice(0, 8)}.pdf`);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            getSafeErrorMessage(
              err,
              'Impossible de charger l’aperçu de la pancarte.'
            )
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [adId]);

  const handleDownload = useCallback(async () => {
    try {
      const blob = await ownerService.downloadAdPlacarde(adId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2500);
    } catch (err) {
      setError(getSafeErrorMessage(err, 'Impossible de télécharger le PDF.'));
    }
  }, [adId, filename]);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        height: '100dvh',
        position: 'relative',
        bgcolor: '#E7EAEE',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ position: 'absolute', inset: 0, px: 2, zIndex: 2 }}
        >
          <CircularProgress sx={{ color: brandAgent.primary }} />
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', mt: 2, textAlign: 'center' }}
          >
            Génération de la pancarte…
          </Typography>
        </Stack>
      )}

      {error && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, sm: 3 },
            zIndex: 2,
          }}
        >
          <AppAlert
            severity="error"
            message={error}
            sx={{ maxWidth: 480, width: '100%' }}
          />
        </Box>
      )}

      {html && (
        <>
          <Box
            component="iframe"
            srcDoc={html}
            title="Aperçu pancarte KeyHome"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 0,
              bgcolor: 'transparent',
            }}
          />

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{
              position: 'absolute',
              bottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.25,
              borderRadius: 999,
              color: neutral.white,
              bgcolor: brandAgent.primary,
              boxShadow: '0 10px 30px -8px rgba(17,24,39,0.45)',
              '&:hover': { bgcolor: brandAgent.primaryDark },
            }}
          >
            Télécharger le PDF (A5)
          </Button>
        </>
      )}
    </Box>
  );
}
