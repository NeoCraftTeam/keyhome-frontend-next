'use client';

import { getLaravelApiErrorMessage } from '@/lib/api-errors';
import { ownerService } from '@/services/owner.service';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

export type QrCodeDialogAd = {
  id: string;
  title: string;
};

type QrCodeDialogProps = {
  open: boolean;
  onClose: () => void;
  variant: 'ad' | 'profile';
  ad?: QrCodeDialogAd | null;
};

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function QrCodeDialog({
  open,
  onClose,
  variant,
  ad,
}: QrCodeDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [busy, setBusy] = useState<null | 'png' | 'pdf' | 'card' | 'copy'>(
    null
  );
  const [snack, setSnack] = useState<string | null>(null);

  const enabledAd = open && variant === 'ad' && !!ad?.id;
  const enabledProfile = open && variant === 'profile';

  const adQuery = useQuery({
    queryKey: ['owner-ad-qr-meta', ad?.id],
    queryFn: () => ownerService.getAdQrCodeMeta(ad!.id),
    enabled: enabledAd,
  });

  const profileQuery = useQuery({
    queryKey: ['owner-profile-qr-meta'],
    queryFn: () => ownerService.getProfileQrMeta(),
    enabled: enabledProfile,
  });

  // HTML preview of the printable business card — used as iframe srcDoc
  // so the in-app preview is a 1:1 render of the downloaded PDF.
  const cardPreviewQuery = useQuery({
    queryKey: ['owner-business-card-preview'],
    queryFn: () => ownerService.fetchBusinessCardPreviewHtml(),
    enabled: enabledProfile,
  });

  const data = variant === 'ad' ? adQuery.data : profileQuery.data;
  const isLoading =
    variant === 'ad' ? adQuery.isLoading : profileQuery.isLoading;
  const isError = variant === 'ad' ? adQuery.isError : profileQuery.isError;
  const error = variant === 'ad' ? adQuery.error : profileQuery.error;
  const refetch = variant === 'ad' ? adQuery.refetch : profileQuery.refetch;

  const primaryUrl =
    variant === 'profile'
      ? (profileQuery.data?.profile_url ?? null)
      : (adQuery.data?.ad_url ?? null);

  const handleCopy = useCallback(async () => {
    if (!primaryUrl) {
      return;
    }
    setBusy('copy');
    try {
      await navigator.clipboard.writeText(primaryUrl);
      setSnack('Lien copié.');
    } catch {
      setSnack('Impossible de copier.');
    } finally {
      setBusy(null);
    }
  }, [primaryUrl]);

  const handlePng = useCallback(async () => {
    if (variant === 'profile') {
      setBusy('png');
      try {
        const blob = await ownerService.downloadProfileQrPng();
        triggerDownload(blob, 'qrcode-profil-keyhome.png');
      } catch (err) {
        setSnack(getLaravelApiErrorMessage(err, 'Téléchargement impossible.'));
      } finally {
        setBusy(null);
      }
      return;
    }
    if (!ad?.id) {
      return;
    }
    setBusy('png');
    try {
      const blob = await ownerService.downloadAdQrPng(ad.id);
      triggerDownload(blob, `qrcode-annonce-${ad.id.slice(0, 8)}.png`);
    } catch (err) {
      setSnack(getLaravelApiErrorMessage(err, 'Téléchargement impossible.'));
    } finally {
      setBusy(null);
    }
  }, [variant, ad?.id]);

  const handlePlacarde = useCallback(async () => {
    if (!ad?.id) {
      return;
    }
    setBusy('pdf');
    try {
      const blob = await ownerService.downloadAdPlacarde(ad.id);
      triggerDownload(blob, 'placarde-keyhome.pdf');
    } catch (err) {
      setSnack(getLaravelApiErrorMessage(err, 'Téléchargement impossible.'));
    } finally {
      setBusy(null);
    }
  }, [ad?.id]);

  const handleBusinessCard = useCallback(async () => {
    setBusy('card');
    try {
      const blob = await ownerService.downloadBusinessCard();
      triggerDownload(blob, 'carte-visite-keyhome.pdf');
    } catch (err) {
      setSnack(getLaravelApiErrorMessage(err, 'Téléchargement impossible.'));
    } finally {
      setBusy(null);
    }
  }, []);

  const title = variant === 'profile' ? 'Profil public' : 'Annonce';
  const subtitle =
    variant === 'profile'
      ? 'Partagez votre profil bailleur'
      : (ad?.title ?? 'Partagez votre annonce');

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            overflow: 'hidden',
            background:
              'linear-gradient(180deg, #FFFFFF 0%, #FFF5F6 60%, #FFEEF1 100%)',
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={onClose}
            aria-label="Fermer"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              bgcolor: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(4px)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Header */}
          <Box sx={{ pt: 4, pb: 1, px: 4, textAlign: 'center' }}>
            <Typography
              variant="overline"
              sx={{
                color: '#F6475F',
                fontWeight: 800,
                letterSpacing: 2,
                fontSize: 11,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.25,
                mt: 0.25,
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          {/* Content */}
          <Box sx={{ px: { xs: 2, sm: 4 }, pb: 3 }}>
            {isLoading && (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: '#F6475F' }} />
              </Box>
            )}

            {isError && (
              <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
                <Typography color="error" variant="body2" textAlign="center">
                  {getLaravelApiErrorMessage(
                    error,
                    'Impossible de charger le QR code.'
                  )}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => refetch()}
                  sx={{ textTransform: 'none' }}
                >
                  Réessayer
                </Button>
              </Stack>
            )}

            {!isLoading && data?.qr_data_uri && (
              <Stack spacing={2} alignItems="center">
                {variant === 'profile' && cardPreviewQuery.data && (
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 460,
                      borderRadius: 3,
                      overflow: 'hidden',
                      background:
                        'linear-gradient(135deg, #FFFFFF 0%, #FFF5F6 100%)',
                      boxShadow:
                        '0 12px 40px -16px rgba(246, 71, 95, 0.25), 0 2px 6px rgba(15, 23, 42, 0.06)',
                    }}
                  >
                    <Box
                      component="iframe"
                      title="Aperçu carte de visite"
                      srcDoc={cardPreviewQuery.data}
                      sx={{
                        width: '100%',
                        height: 220,
                        border: 0,
                        background: 'transparent',
                        display: 'block',
                      }}
                    />
                  </Box>
                )}

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 4,
                    background: '#FFFFFF',
                    boxShadow:
                      '0 18px 50px -20px rgba(246, 71, 95, 0.35), 0 2px 8px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <Box
                    component="img"
                    src={data.qr_data_uri}
                    alt="QR code"
                    sx={{
                      width: { xs: 220, sm: 260 },
                      height: { xs: 220, sm: 260 },
                      display: 'block',
                    }}
                  />
                </Box>

                {primaryUrl && (
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      py: 0.75,
                      borderRadius: 999,
                      bgcolor: 'rgba(246, 71, 95, 0.08)',
                      color: '#64748B',
                      maxWidth: '100%',
                      wordBreak: 'break-all',
                      textAlign: 'center',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      fontSize: 11,
                    }}
                  >
                    {primaryUrl}
                  </Typography>
                )}
              </Stack>
            )}
          </Box>

          {/* Actions */}
          {!isLoading && data?.qr_data_uri && (
            <Box
              sx={{
                px: { xs: 2, sm: 4 },
                pb: 3,
                pt: 1,
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Button
                startIcon={
                  busy === 'copy' ? (
                    <CircularProgress size={16} />
                  ) : (
                    <CopyIcon fontSize="small" />
                  )
                }
                onClick={handleCopy}
                disabled={!primaryUrl || busy !== null}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#475569',
                  borderRadius: 2.5,
                }}
              >
                Copier
              </Button>
              <Button
                variant="outlined"
                startIcon={
                  busy === 'png' ? (
                    <CircularProgress size={16} />
                  ) : (
                    <DownloadIcon fontSize="small" />
                  )
                }
                onClick={handlePng}
                disabled={!data?.qr_data_uri || busy !== null}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  borderColor: '#E2E8F0',
                  color: '#0F172A',
                  '&:hover': {
                    borderColor: '#CBD5E1',
                    bgcolor: 'rgba(15, 23, 42, 0.03)',
                  },
                }}
              >
                PNG
              </Button>
              {variant === 'ad' && (
                <Button
                  variant="contained"
                  startIcon={
                    busy === 'pdf' ? (
                      <CircularProgress size={16} sx={{ color: '#fff' }} />
                    ) : (
                      <PdfIcon fontSize="small" />
                    )
                  }
                  onClick={handlePlacarde}
                  disabled={busy !== null}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2.5,
                    bgcolor: '#F6475F',
                    boxShadow: '0 8px 20px -8px rgba(246, 71, 95, 0.55)',
                    '&:hover': { bgcolor: '#E0334A' },
                  }}
                >
                  Pancarte A5
                </Button>
              )}
              {variant === 'profile' && (
                <Button
                  variant="contained"
                  startIcon={
                    busy === 'card' ? (
                      <CircularProgress size={16} sx={{ color: '#fff' }} />
                    ) : (
                      <PdfIcon fontSize="small" />
                    )
                  }
                  onClick={handleBusinessCard}
                  disabled={busy !== null}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2.5,
                    bgcolor: '#0D9488',
                    boxShadow: '0 8px 20px -8px rgba(13, 148, 136, 0.55)',
                    '&:hover': { bgcolor: '#0F766E' },
                  }}
                >
                  Carte de visite
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
      <Snackbar
        open={!!snack}
        autoHideDuration={2500}
        onClose={() => setSnack(null)}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
