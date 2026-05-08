'use client';

import { getLaravelApiErrorMessage } from '@/lib/api-errors';
import { brand, brandAgent } from '@/theme/tokens';
import { ownerService } from '@/services/owner.service';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
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
import { useCallback, useEffect, useRef, useState } from 'react';

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

type BusinessCardPreviewWindow = Window & {
  __khBusinessCardPreviewRefit?: () => void;
};

function refitBusinessCardPreviewIframe(
  iframe: HTMLIFrameElement | null
): void {
  if (!iframe) {
    return;
  }
  const win = iframe.contentWindow as BusinessCardPreviewWindow | null;
  win?.__khBusinessCardPreviewRefit?.();
}

export default function QrCodeDialog({
  open,
  onClose,
  variant,
  ad,
}: QrCodeDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [busy, setBusy] = useState<null | 'png' | 'pdf' | 'card' | 'copy'>(
    null
  );
  const [snack, setSnack] = useState<string | null>(null);

  const enabledAd = open && variant === 'ad' && !!ad?.id;
  const enabledProfile = open && variant === 'profile';

  const cardPreviewQuery = useQuery({
    queryKey: ['owner-business-card-preview'],
    queryFn: () => ownerService.fetchBusinessCardPreviewHtml(),
    enabled: enabledProfile,
  });

  const adQuery = useQuery({
    queryKey: ['owner-ad-qr-meta', ad?.id],
    queryFn: () => ownerService.getAdQrCodeMeta(ad!.id),
    enabled: enabledAd,
  });

  const adData = adQuery.data;
  const isProfile = variant === 'profile';

  const isLoading = isProfile ? cardPreviewQuery.isLoading : adQuery.isLoading;
  const isError = isProfile ? cardPreviewQuery.isError : adQuery.isError;
  const error = isProfile ? cardPreviewQuery.error : adQuery.error;
  const refetch = isProfile ? cardPreviewQuery.refetch : adQuery.refetch;

  const primaryUrl = !isProfile ? (adData?.ad_url ?? null) : null;

  useEffect(() => {
    if (!enabledProfile || !cardPreviewQuery.data) {
      return;
    }
    const iframe = previewIframeRef.current;
    if (!iframe) {
      return;
    }
    const ro = new ResizeObserver(() => {
      refitBusinessCardPreviewIframe(iframe);
    });
    ro.observe(iframe);
    return () => {
      ro.disconnect();
    };
  }, [enabledProfile, cardPreviewQuery.data]);

  const handlePrintCard = useCallback(() => {
    const w = previewIframeRef.current?.contentWindow;
    if (!w) {
      return;
    }
    w.focus();
    w.print();
  }, []);

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
  }, [ad?.id]);

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

  const title = isProfile ? 'Carte de visite' : 'Annonce';
  const subtitle = isProfile
    ? 'Imprimez ou exportez en PDF'
    : (ad?.title ?? 'Partagez votre annonce');

  const profileHeaderAccent = brandAgent.primary;
  const adAccent = brand.primary;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        slotProps={{
          backdrop: {
            sx: { bgcolor: 'rgba(15, 23, 42, 0.45)' },
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            overflow: 'hidden',
            bgcolor: '#FFFFFF',
            backgroundImage: 'none',
            border: isProfile
              ? `1px solid ${brandAgent.primaryAlpha20}`
              : `1px solid ${brand.primaryAlpha15}`,
            boxShadow: '0 24px 64px rgba(15, 23, 42, 0.14)',
            ...(isProfile && {
              maxWidth: { xs: '100%', sm: 528 },
            }),
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            position: 'relative',
            bgcolor: '#FFFFFF',
          }}
        >
          <IconButton
            onClick={onClose}
            aria-label="Fermer"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              bgcolor: isProfile ? brandAgent.primaryAlpha10 : '#fff',
              border: `1px solid ${isProfile ? brandAgent.primaryAlpha20 : 'divider'}`,
              '&:hover': {
                bgcolor: isProfile ? brandAgent.primaryAlpha20 : 'grey.100',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box
            sx={{ pt: 3, pb: 0.5, px: { xs: 2, sm: 2.5 }, textAlign: 'center' }}
          >
            <Typography
              variant="overline"
              sx={{
                color: isProfile ? profileHeaderAccent : adAccent,
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

          <Box
            sx={{
              px: { xs: 2, sm: 2.5 },
              pb: { xs: 2, sm: 2.5 },
            }}
          >
            {isLoading && (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress
                  sx={{ color: isProfile ? brandAgent.primary : adAccent }}
                />
              </Box>
            )}

            {isError && (
              <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
                <Typography color="error" variant="body2" textAlign="center">
                  {getLaravelApiErrorMessage(
                    error,
                    isProfile
                      ? 'Impossible de charger la carte de visite.'
                      : 'Impossible de charger le QR code.'
                  )}
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => refetch()}
                  sx={{ textTransform: 'none' }}
                >
                  Réessayer
                </Button>
              </Stack>
            )}

            {isProfile && !isLoading && !isError && cardPreviewQuery.data && (
              <Stack spacing={2} alignItems="stretch" sx={{ width: '100%' }}>
                <Box
                  sx={{
                    width: '100%',
                    mx: 'auto',
                    aspectRatio: '90 / 55',
                    maxHeight: { xs: 'min(48dvh, 360px)', sm: 'none' },
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: '#F8FAFC',
                    border: `1px solid ${brandAgent.primaryAlpha20}`,
                    boxShadow: `0 8px 32px -12px ${brandAgent.primaryAlpha20}`,
                    position: 'relative',
                    isolation: 'isolate',
                  }}
                >
                  <Box
                    ref={previewIframeRef}
                    component="iframe"
                    title="Aperçu carte de visite"
                    srcDoc={cardPreviewQuery.data}
                    onLoad={() => {
                      refitBusinessCardPreviewIframe(previewIframeRef.current);
                    }}
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      border: 0,
                      bgcolor: 'transparent',
                      display: 'block',
                    }}
                  />
                </Box>
              </Stack>
            )}

            {!isProfile && !isLoading && adData?.qr_data_uri && (
              <Stack spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 4,
                    background: '#FFFFFF',
                    border: `1px solid ${brand.primaryAlpha12}`,
                    boxShadow: '0 12px 40px -16px rgba(246, 71, 95, 0.2)',
                  }}
                >
                  <Box
                    component="img"
                    src={adData.qr_data_uri}
                    alt="QR code annonce"
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
                      bgcolor: brand.primaryAlpha10,
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

          {isProfile && !isLoading && !isError && cardPreviewQuery.data && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{
                px: { xs: 2, sm: 2.5 },
                pb: { xs: 2, sm: 2.5 },
                pt: 0,
                justifyContent: 'center',
                alignItems: 'stretch',
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PrintIcon />}
                onClick={handlePrintCard}
                disabled={busy !== null}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  borderColor: brandAgent.primary,
                  color: brandAgent.primaryDark,
                  '&:hover': {
                    borderColor: brandAgent.primaryDark,
                    bgcolor: brandAgent.primaryAlpha10,
                  },
                }}
              >
                Imprimer
              </Button>
              <Button
                variant="contained"
                startIcon={
                  busy === 'card' ? (
                    <CircularProgress size={16} sx={{ color: '#fff' }} />
                  ) : (
                    <PdfIcon />
                  )
                }
                onClick={handleBusinessCard}
                disabled={busy !== null}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: brandAgent.primary,
                  boxShadow: `0 8px 24px -6px ${brandAgent.primaryAlpha20}`,
                  '&:hover': { bgcolor: brandAgent.primaryDark },
                }}
              >
                Télécharger le PDF
              </Button>
            </Stack>
          )}

          {!isProfile && !isLoading && adData?.qr_data_uri && (
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
                disabled={!adData?.qr_data_uri || busy !== null}
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
                  bgcolor: brand.primary,
                  boxShadow: '0 8px 20px -8px rgba(246, 71, 95, 0.55)',
                  '&:hover': { bgcolor: brand.primaryDark },
                }}
              >
                Pancarte A5
              </Button>
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
