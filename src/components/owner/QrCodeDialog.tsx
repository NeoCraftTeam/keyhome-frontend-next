'use client';

import { getLaravelApiErrorMessage } from '@/lib/api-errors';
import { ownerService } from '@/services/owner.service';
import {
  brandAgent,
  neutral,
  shadow,
  spacing,
  transition,
} from '@/theme/tokens';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
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

  const slateShadowTint = alpha(theme.palette.grey[900], 0.06);
  const [busy, setBusy] = useState<null | 'png' | 'pdf' | 'card' | 'copy'>(
    null
  );
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

  const cardPreviewQuery = useQuery({
    queryKey: ['owner-business-card-preview'],
    queryFn: ({ signal }) =>
      ownerService.fetchBusinessCardPreviewHtml({ signal }),
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

  const handleCopy = useCallback(async () => {
    if (!primaryUrl) {
      return;
    }
    setBusy('copy');
    try {
      await navigator.clipboard.writeText(primaryUrl);
      notify('Lien copié dans le presse-papiers.', 'success');
    } catch {
      notify(
        'Impossible de copier. Sélectionnez le lien manuellement ou réessayez.',
        'error'
      );
    } finally {
      setBusy(null);
    }
  }, [notify, primaryUrl]);

  const handlePng = useCallback(async () => {
    if (variant === 'profile') {
      setBusy('png');
      try {
        const blob = await ownerService.downloadProfileQrPng();
        triggerDownload(blob, 'qrcode-profil-keyhome.png');
      } catch (err) {
        notify(
          getLaravelApiErrorMessage(err, 'Téléchargement du PNG impossible.'),
          'error'
        );
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
      notify(
        getLaravelApiErrorMessage(err, 'Téléchargement du PNG impossible.'),
        'error'
      );
    } finally {
      setBusy(null);
    }
  }, [ad?.id, variant, notify]);

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

  const paperBackdropTop = alpha(brandAgent.primary, 0.14);
  const paperWashMid = neutral.white;

  const qrDiameter = isMobile ? 252 : 288;
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
  const showPreviewSkeleton =
    variant === 'profile' && cardPreviewQuery.isLoading && hasQr;

  const showCardPreviewReady =
    variant === 'profile' && !!cardPreviewQuery.data && hasQr;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        aria-labelledby={titleId}
        aria-describedby={descId}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: prefersReducedMotion ? 'none' : 'blur(10px)',
              backgroundColor: alpha(brandAgent.primaryDark, 0.42),
              transition: prefersReducedMotion ? 'none' : transition.polish,
            },
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            overflow: 'hidden',
            bgcolor: neutral.white,
            border: `${isMobile ? 0 : 1}px solid ${brandAgent.primaryAlpha20}`,
            boxShadow: isMobile
              ? `${shadow.medium}, inset 0 1px 0 ${brandAgent.primaryAlpha16}`
              : `${shadow.modal}, inset 0 1px 0 ${brandAgent.primaryAlpha16}`,
            backgroundImage: `
              linear-gradient(180deg, ${paperBackdropTop} 0%, ${paperWashMid} 38%, ${brandAgent.primaryAlpha10} 100%)
            `,
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {/* Header grille : équilibre visuel + ordre TAB logique */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '40px 1fr 44px', sm: '48px 1fr 48px' },
              alignItems: 'start',
              pt: spacing.lg,
              pb: spacing.sm,
              px: spacing.lg,
              columnGap: spacing.md,
              rowGap: spacing.sm,
            }}
          >
            <Box
              sx={{
                gridColumn: 2,
                textAlign: 'center',
                minWidth: 0,
                position: 'relative',
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: 'primary.main',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  fontSize: 11,
                  display: 'block',
                }}
              >
                {headline.kicker}
              </Typography>
              <Typography
                id={titleId}
                component="h2"
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  lineHeight: 1.3,
                  mt: 0.5,
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  maxWidth: '100%',
                }}
              >
                {headline.title}
              </Typography>
              <Typography
                id={descId}
                component="p"
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
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

            <IconButton
              onClick={onClose}
              aria-label="Fermer la fenêtre partage QR"
              sx={{
                gridColumn: 3,
                justifySelf: 'end',
                minWidth: BUTTON_MIN_H,
                minHeight: BUTTON_MIN_H,
                bgcolor: alpha(neutral.white, 0.7),
                backdropFilter: prefersReducedMotion ? 'none' : 'blur(4px)',
                transition: prefersReducedMotion ? 'none' : transition.polish,
                '&:hover': { bgcolor: alpha(neutral.white, 0.95) },
                '&:focus-visible': {
                  boxShadow: shadow.agentFocusRing,
                  outline: 'none',
                },
                ...(prefersReducedMotion
                  ? ({
                      '@media (prefers-reduced-motion: reduce)': {
                        transition: 'none',
                      },
                    } as const)
                  : {}),
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              px: { xs: spacing.md, sm: spacing.lg },
              pb: spacing.lg,
            }}
          >
            {isLoading && (
              <Stack
                spacing={spacing.md}
                alignItems="center"
                sx={{ py: spacing.xl }}
                aria-busy="true"
                aria-label="Chargement des données du QR code"
              >
                {variant === 'profile' && (
                  <Skeleton
                    variant="rounded"
                    width="min(92%, 400px)"
                    height={200}
                    sx={{ borderRadius: 3, maxWidth: 460 }}
                  />
                )}
                <Skeleton
                  variant="circular"
                  width={qrDiameter}
                  height={qrDiameter}
                  sx={{
                    flexShrink: 0,
                    boxShadow: `0 8px 28px ${alpha(brandAgent.primary, 0.12)}`,
                  }}
                />
                <Stack direction="row" spacing={spacing.sm} alignItems="center">
                  <CircularProgress size={22} sx={{ color: 'primary.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Chargement du QR code…
                  </Typography>
                </Stack>
              </Stack>
            )}

            {isError && (
              <Stack
                spacing={spacing.md}
                alignItems="center"
                sx={{ py: spacing.xl }}
              >
                <Typography
                  id={liveErrorId}
                  role="alert"
                  color="error"
                  variant="body2"
                  textAlign="center"
                >
                  {getLaravelApiErrorMessage(
                    error,
                    'Le QR code n’a pas pu être chargé.'
                  )}
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => refetch()}
                  sx={{
                    ...actionButtonSx,
                    fontWeight: 700,
                  }}
                >
                  Réessayer
                </Button>
              </Stack>
            )}

            {hasQr && (
              <Stack spacing={spacing.lg} alignItems="center">
                {variant === 'profile' && (
                  <Box sx={{ width: '100%', maxWidth: 460 }}>
                    {showPreviewSkeleton && (
                      <Skeleton
                        variant="rounded"
                        width="100%"
                        height={220}
                        sx={{ borderRadius: 3 }}
                      />
                    )}
                    {cardPreviewQuery.isError && !showPreviewSkeleton && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ py: spacing.sm }}
                      >
                        Aperçu carte indisponible. Le PDF se télécharge
                        normalement.
                      </Typography>
                    )}
                    {showCardPreviewReady && (
                      <Box
                        sx={{
                          borderRadius: 3,
                          overflow: 'hidden',
                          background: `linear-gradient(135deg, ${neutral.white} 0%, ${brandAgent.primaryAlpha08} 100%)`,
                          boxShadow: `0 12px 40px -16px ${brandAgent.primaryAlpha25}, 0 2px 6px ${slateShadowTint}`,
                          transition: prefersReducedMotion
                            ? 'none'
                            : transition.polish,
                          ...(prefersReducedMotion
                            ? ({
                                '@media (prefers-reduced-motion: reduce)': {
                                  transition: 'none',
                                },
                              } as const)
                            : {}),
                        }}
                      >
                        <Box
                          component="iframe"
                          title="Aperçu de la carte de visite à télécharger"
                          srcDoc={cardPreviewQuery.data}
                          sandbox="allow-scripts allow-same-origin"
                          referrerPolicy="no-referrer"
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
                  </Box>
                )}

                {isMetaBusy && (
                  <Stack
                    direction="row"
                    spacing={spacing.sm}
                    alignItems="center"
                  >
                    <CircularProgress
                      size={18}
                      sx={{ color: 'primary.main' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Mise à jour…
                    </Typography>
                  </Stack>
                )}

                <Stack spacing={spacing.sm} alignItems="center">
                  <Box
                    sx={{
                      width: { xs: 252, sm: 288 },
                      height: { xs: 252, sm: 288 },
                      flexShrink: 0,
                      borderRadius: '50%',
                      boxSizing: 'border-box',
                      p: { xs: 1.25, sm: 1.5 },
                      mx: 'auto',
                      border: `2px solid ${alpha(theme.palette.grey[900], 0.14)}`,
                      background: `linear-gradient(155deg, ${neutral.white} 0%, ${alpha(theme.palette.grey[900], 0.04)} 100%)`,
                      boxShadow: `0 14px 42px -18px ${brandAgent.primaryAlpha25}, 0 4px 12px ${slateShadowTint}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: prefersReducedMotion
                        ? 'none'
                        : transition.polish,
                      ...(prefersReducedMotion
                        ? {}
                        : {
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 18px 46px -16px ${alpha(theme.palette.primary.main, 0.22)}, 0 6px 14px ${slateShadowTint}`,
                            },
                          }),
                      ...(prefersReducedMotion
                        ? ({
                            '@media (prefers-reduced-motion: reduce)': {
                              transition: 'none',
                              '&:hover': { transform: 'none' },
                            },
                          } as const)
                        : {}),
                    }}
                  >
                    <Box
                      component="img"
                      src={data!.qr_data_uri}
                      alt={qrImageAlt}
                      sx={{
                        width: '71%',
                        height: '71%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        borderRadius: 2,
                      }}
                    />
                  </Box>
                </Stack>
              </Stack>
            )}
          </Box>

          {hasQr && (
            <Box
              component="nav"
              aria-label="Actions de partage"
              sx={{
                px: { xs: spacing.md, sm: spacing.lg },
                pb: spacing.lg,
                pt: spacing.sm,
                display: 'flex',
                gap: spacing.md,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Button
                startIcon={
                  busy === 'copy' ? (
                    <CircularProgress size={16} aria-hidden />
                  ) : (
                    <CopyIcon fontSize="small" aria-hidden />
                  )
                }
                onClick={handleCopy}
                disabled={!primaryUrl || busy !== null}
                aria-busy={busy === 'copy'}
                sx={{
                  ...actionButtonSx,
                  fontWeight: 600,
                  color: 'text.secondary',
                  '&:focus-visible': {
                    boxShadow: shadow.agentFocusRing,
                    outline: 'none',
                  },
                }}
              >
                Copier le lien public
              </Button>
              <Button
                variant="outlined"
                startIcon={
                  busy === 'png' ? (
                    <CircularProgress size={16} aria-hidden />
                  ) : (
                    <DownloadIcon fontSize="small" aria-hidden />
                  )
                }
                onClick={handlePng}
                disabled={busy !== null}
                aria-busy={busy === 'png'}
                sx={{
                  ...actionButtonSx,
                  fontWeight: 700,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'action.disabled',
                    bgcolor: alpha(theme.palette.common.black, 0.03),
                  },
                  '&:focus-visible': {
                    boxShadow: shadow.agentFocusRing,
                    outline: 'none',
                  },
                }}
              >
                Télécharger le QR (PNG)
              </Button>
              {variant === 'ad' && (
                <Button
                  variant="contained"
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
              {variant === 'profile' && (
                <Button
                  variant="contained"
                  startIcon={
                    busy === 'card' ? (
                      <CircularProgress
                        size={16}
                        sx={{ color: 'primary.contrastText' }}
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
                  Carte de visite (PDF)
                </Button>
              )}
            </Box>
          )}
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
