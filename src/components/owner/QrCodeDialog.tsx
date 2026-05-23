'use client';

import { getLaravelApiErrorMessage } from '@/lib/api-errors';
import { ownerService } from '@/services/owner.service';
import { brandAgent, neutral, shadow, transition } from '@/theme/tokens';
import {
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useId, useMemo, useState } from 'react';

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

type SnackState = null | {
  message: string;
  severity: 'success' | 'error';
};

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
}

const BUTTON_MIN_H = 44;

export default function QrCodeDialog({
  open,
  onClose,
  variant,
  ad,
}: QrCodeDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)',
    { defaultMatches: false }
  );
  const titleId = useId();
  const descId = useId();
  const liveErrorId = useId();

  const [busy, setBusy] = useState<null | 'pdf' | 'card'>(null);
  const [snack, setSnack] = useState<SnackState>(null);

  const enabledAd = open && variant === 'ad' && !!ad?.id;
  const enabledProfile = open && variant === 'profile';

  const adQuery = useQuery({
    queryKey: ['owner-ad-qr-meta', ad?.id],
    queryFn: ({ signal }) => ownerService.getAdQrCodeMeta(ad!.id, { signal }),
    enabled: enabledAd,
  });

  const profileQuery = useQuery({
    queryKey: ['owner-profile-qr-meta'],
    queryFn: ({ signal }) => ownerService.getProfileQrMeta({ signal }),
    enabled: enabledProfile,
  });

  const data = variant === 'ad' ? adQuery.data : profileQuery.data;
  const isLoading =
    variant === 'ad' ? adQuery.isLoading : profileQuery.isLoading;
  const isError = variant === 'ad' ? adQuery.isError : profileQuery.isError;
  const error = variant === 'ad' ? adQuery.error : profileQuery.error;
  const refetch = variant === 'ad' ? adQuery.refetch : profileQuery.refetch;

  const isMetaBusy =
    variant === 'ad'
      ? adQuery.isFetching && !adQuery.isLoading
      : profileQuery.isFetching && !profileQuery.isLoading;

  const qrImageAlt =
    variant === 'profile'
      ? 'QR code ouvrant le profil public bailleur sur KeyHome'
      : `QR code ouvrant l'annonce : ${ad?.title?.trim() || 'votre annonce'}`;

  const headline = useMemo(
    () =>
      variant === 'profile'
        ? { kicker: 'Profil bailleur', title: 'Votre page publique' }
        : {
            kicker: 'Annonce à partager',
            title: ad?.title || 'QR code annonce',
          },
    [variant, ad?.title]
  );

  const descriptionText =
    variant === 'profile'
      ? 'Un scan renvoie vers votre vitrine bailleur.'
      : 'Partage scan-to-web : aucune URL lisible sous le code.';

  const notify = useCallback(
    (message: string, severity: 'success' | 'error') => {
      setSnack({ message, severity });
    },
    []
  );

  const handlePlacarde = useCallback(async () => {
    if (!ad?.id) {
      return;
    }
    setBusy('pdf');
    try {
      const blob = await ownerService.downloadAdPlacarde(ad.id);
      triggerDownload(blob, 'placarde-keyhome.pdf');
    } catch (err) {
      notify(
        getLaravelApiErrorMessage(err, 'Impossible de générer le PDF.'),
        'error'
      );
    } finally {
      setBusy(null);
    }
  }, [ad?.id, notify]);

  const handleBusinessCard = useCallback(async () => {
    setBusy('card');
    try {
      const blob = await ownerService.downloadBusinessCard();
      triggerDownload(blob, 'carte-visite-keyhome.pdf');
    } catch (err) {
      notify(
        getLaravelApiErrorMessage(err, 'Impossible de générer le PDF.'),
        'error'
      );
    } finally {
      setBusy(null);
    }
  }, [notify]);

  const actionButtonSx = useMemo(
    () => ({
      textTransform: 'none' as const,
      borderRadius: 2.5,
      minHeight: BUTTON_MIN_H,
      px: 2,
      transition: prefersReducedMotion ? 'none' : transition.polish,
      '&:focus-visible': {
        boxShadow: shadow.agentFocusRing,
        outline: 'none',
      },
      ...(prefersReducedMotion
        ? ({
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          } as const)
        : {}),
    }),
    [prefersReducedMotion]
  );

  const hasQr = !!data?.qr_data_uri && !isLoading;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        aria-labelledby={titleId}
        aria-describedby={descId}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: prefersReducedMotion ? 'none' : 'blur(12px)',
              backgroundColor: alpha(brandAgent.primaryDark, 0.45),
              transition: prefersReducedMotion ? 'none' : transition.polish,
            },
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 5,
            overflow: 'hidden',
            bgcolor: neutral.white,
            border: `${isMobile ? 0 : 1}px solid ${alpha(brandAgent.primary, 0.1)}`,
            boxShadow: isMobile
              ? shadow.medium
              : `0 32px 80px -24px ${alpha(brandAgent.primary, 0.28)}, 0 8px 24px ${alpha('#000', 0.1)}`,
          },
        }}
      >
        <DialogContent sx={{ p: 0, overflowX: 'hidden' }}>
          {/* ── Hero header ──────────────────────────────────────────── */}
          <Box
            sx={{
              position: 'relative',
              px: { xs: 2.5, sm: 3 },
              pt: { xs: 2.5, sm: 3 },
              pb: 2,
              background: `radial-gradient(ellipse 140% 110% at 50% 0%, ${alpha(brandAgent.primary, 0.13)} 0%, transparent 72%)`,
              borderBottom: `1px solid ${alpha(brandAgent.primary, 0.07)}`,
            }}
          >
            <IconButton
              onClick={onClose}
              aria-label="Fermer la fenêtre partage QR"
              size="small"
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: alpha(neutral.white, 0.82),
                backdropFilter: prefersReducedMotion ? 'none' : 'blur(4px)',
                transition: prefersReducedMotion ? 'none' : transition.polish,
                '&:hover': { bgcolor: neutral.white },
                '&:focus-visible': {
                  boxShadow: shadow.agentFocusRing,
                  outline: 'none',
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>

            <Typography
              variant="overline"
              sx={{
                display: 'block',
                color: 'primary.main',
                fontWeight: 800,
                letterSpacing: '0.09em',
                fontSize: 10,
                lineHeight: 1.6,
              }}
            >
              {headline.kicker}
            </Typography>
            <Typography
              id={titleId}
              component="h2"
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                lineHeight: 1.3,
                mt: 0.25,
                pr: 4,
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {headline.title}
            </Typography>
            <Typography
              id={descId}
              component="p"
              sx={{
                position: 'absolute',
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              {descriptionText}
            </Typography>
          </Box>

          <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 3 }}>
            {/* Loading */}
            {isLoading && (
              <Stack
                spacing={2}
                alignItems="center"
                sx={{ py: 4 }}
                aria-busy="true"
                aria-label="Chargement du QR code"
              >
                <Skeleton
                  variant="rounded"
                  width="52%"
                  sx={{
                    aspectRatio: '1000 / 1200',
                    borderRadius: 3,
                    boxShadow: `0 8px 24px ${alpha(brandAgent.primary, 0.12)}`,
                  }}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={18} sx={{ color: 'primary.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Chargement…
                  </Typography>
                </Stack>
              </Stack>
            )}

            {/* Error */}
            {isError && (
              <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
                <Typography
                  id={liveErrorId}
                  role="alert"
                  color="error"
                  variant="body2"
                  textAlign="center"
                >
                  {getLaravelApiErrorMessage(
                    error,
                    'Le QR code n\u2019a pas pu \u00eatre charg\u00e9.'
                  )}
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => refetch()}
                  sx={{ ...actionButtonSx, fontWeight: 700 }}
                >
                  Réessayer
                </Button>
              </Stack>
            )}

            {/* QR + Actions */}
            {hasQr && (
              <Stack spacing={3}>
                {/* QR display — glowing frosted card */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    py: { xs: 2.5, sm: 3 },
                    borderRadius: 4,
                    background: `radial-gradient(ellipse 110% 90% at 50% 25%, ${alpha(brandAgent.primary, 0.1)} 0%, ${alpha(brandAgent.primary, 0.03)} 55%, transparent 100%)`,
                    border: `1px solid ${alpha(brandAgent.primary, 0.09)}`,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '58%', sm: '50%' },
                      maxWidth: 220,
                      borderRadius: 3,
                      overflow: 'hidden',
                      boxShadow: `0 20px 56px -14px ${alpha(brandAgent.primary, 0.42)}, 0 4px 16px ${alpha('#000', 0.09)}`,
                      transition: prefersReducedMotion
                        ? 'none'
                        : transition.polish,
                      ...(prefersReducedMotion
                        ? ({
                            '@media (prefers-reduced-motion: reduce)': {
                              transition: 'none',
                            },
                          } as const)
                        : {
                            '&:hover': {
                              transform: 'translateY(-3px) scale(1.015)',
                              boxShadow: `0 28px 64px -12px ${alpha(brandAgent.primary, 0.52)}, 0 6px 20px ${alpha('#000', 0.11)}`,
                            },
                          }),
                    }}
                  >
                    <Box
                      component="img"
                      src={data!.qr_data_uri}
                      alt={qrImageAlt}
                      sx={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </Box>
                </Box>

                {/* Refresh indicator */}
                {isMetaBusy && (
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <CircularProgress
                      size={14}
                      sx={{ color: 'primary.main' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Mise à jour…
                    </Typography>
                  </Stack>
                )}

                {/* Download actions */}
                <Stack
                  component="nav"
                  aria-label="Téléchargements"
                  spacing={1.5}
                >
                  {variant === 'ad' && (
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={
                        busy === 'pdf' ? (
                          <CircularProgress
                            size={16}
                            sx={{ color: 'primary.contrastText' }}
                            aria-hidden
                          />
                        ) : (
                          <PdfIcon fontSize="small" aria-hidden />
                        )
                      }
                      onClick={handlePlacarde}
                      disabled={busy !== null}
                      aria-busy={busy === 'pdf'}
                      sx={{
                        ...actionButtonSx,
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        py: 1.25,
                        bgcolor: 'primary.main',
                        boxShadow: shadow.agentGlow,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          boxShadow: shadow.ownerContainedHover,
                        },
                        '&:focus-visible': {
                          boxShadow: `${shadow.agentFocusRing}, ${shadow.agentGlow}`,
                          outline: 'none',
                        },
                      }}
                    >
                      Pancarte vitrine (PDF&nbsp;A5)
                    </Button>
                  )}
                  <Button
                    variant={variant === 'ad' ? 'outlined' : 'contained'}
                    fullWidth
                    startIcon={
                      busy === 'card' ? (
                        <CircularProgress
                          size={16}
                          sx={{
                            color:
                              variant === 'ad'
                                ? 'primary.main'
                                : 'primary.contrastText',
                          }}
                          aria-hidden
                        />
                      ) : (
                        <PdfIcon fontSize="small" aria-hidden />
                      )
                    }
                    onClick={handleBusinessCard}
                    disabled={busy !== null}
                    aria-busy={busy === 'card'}
                    sx={{
                      ...actionButtonSx,
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      py: 1.25,
                      ...(variant === 'ad'
                        ? {
                            borderColor: alpha(brandAgent.primary, 0.35),
                            color: 'primary.main',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: alpha(brandAgent.primary, 0.04),
                            },
                          }
                        : {
                            bgcolor: 'primary.main',
                            boxShadow: shadow.agentGlow,
                            '&:hover': {
                              bgcolor: 'primary.dark',
                              boxShadow: shadow.ownerContainedHover,
                            },
                          }),
                      '&:focus-visible': {
                        boxShadow: `${shadow.agentFocusRing}, ${shadow.agentGlow}`,
                        outline: 'none',
                      },
                    }}
                  >
                    Carte de visite (PDF)
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={2600}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? (
          <Alert
            onClose={() => setSnack(null)}
            severity={snack.severity}
            variant="filled"
            elevation={6}
            sx={{
              width: '100%',
              alignItems: 'center',
              fontWeight: 600,
              boxShadow: shadow.medium,
              transition: prefersReducedMotion ? 'none' : transition.polish,
            }}
          >
            {snack.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
