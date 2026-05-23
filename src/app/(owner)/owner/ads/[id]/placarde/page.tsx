'use client';

import { getLaravelApiErrorMessage } from '@/lib/api-errors';
import { isLikelyIosWebKit } from '@/lib/ios-environment';
import { ownerService } from '@/services/owner.service';
import { brandAgent, neutral } from '@/theme/tokens';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function AdPlacardePreviewPage() {
  const params = useParams<{ id: string }>();
  const adId = params?.id ?? '';
  const objectUrlRef = useRef<string | null>(null);
  const [preferInlinePreview, setPreferInlinePreview] = useState(true);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState('placarde-keyhome.pdf');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Pancarte KeyHome';
    setPreferInlinePreview(!isLikelyIosWebKit());
  }, []);

  useEffect(() => {
    if (!adId) {
      setError('Annonce introuvable.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const blob = await ownerService.fetchAdPlacardePreview(adId);
        if (cancelled) {
          return;
        }
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setPdfUrl(objectUrl);
        setFilename(`placarde-${adId.slice(0, 8)}.pdf`);
      } catch (err) {
        if (!cancelled) {
          setError(
            getLaravelApiErrorMessage(
              err,
              'Impossible de charger l\u2019aper\u00e7u de la pancarte.'
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
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
      setError(
        getLaravelApiErrorMessage(
          err,
          'Impossible de t\u00e9l\u00e9charger le PDF.'
        )
      );
    }
  }, [adId, filename]);

  const handleOpenPdf = useCallback(() => {
    if (!pdfUrl) {
      return;
    }
    const opened = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      void handleDownload();
    }
  }, [pdfUrl, handleDownload]);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        height: '100dvh',
        position: 'relative',
        bgcolor: '#525659',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ position: 'absolute', inset: 0, px: 2, zIndex: 2 }}
        >
          <CircularProgress sx={{ color: neutral.white }} />
          <Typography
            variant="body2"
            sx={{ color: neutral.white, mt: 2, textAlign: 'center' }}
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
          <Alert severity="error" sx={{ maxWidth: 480, width: '100%' }}>
            {error}
          </Alert>
        </Box>
      )}

      {pdfUrl && preferInlinePreview && (
        <Box
          component="iframe"
          src={pdfUrl}
          title="Aperçu pancarte KeyHome"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
            bgcolor: '#525659',
          }}
        />
      )}

      {pdfUrl && !preferInlinePreview && (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{
            position: 'absolute',
            inset: 0,
            px: 3,
            textAlign: 'center',
            bgcolor: '#334155',
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ color: neutral.white }}
          >
            Pancarte prête
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.82)', maxWidth: 360 }}
          >
            Sur iPhone et iPad, ouvrez le PDF dans le lecteur natif ou
            téléchargez-le.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ width: '100%', maxWidth: 360 }}
          >
            <Button
              fullWidth
              variant="contained"
              startIcon={<OpenInNewIcon />}
              onClick={handleOpenPdf}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: brandAgent.primary,
                '&:hover': { bgcolor: brandAgent.primaryDark },
              }}
            >
              Ouvrir le PDF
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: neutral.white,
                borderColor: 'rgba(255,255,255,0.45)',
                '&:hover': {
                  borderColor: neutral.white,
                  bgcolor: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              Télécharger
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
