'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { mfaErrorMessage } from '@/lib/auth/mfa-challenge';
import {
  mfaService,
  type MfaStatusResponse,
  type TotpSetupStartResponse,
} from '@/services/mfa.service';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import ShieldIcon from '@mui/icons-material/Shield';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

/** Which confirmation the dialog is currently collecting a code for. */
type ConfirmAction = 'disable' | 'regenerate';

type PendingAction = 'start' | 'confirm' | ConfirmAction;

const RECOVERY_FILE_NAME = 'keyhome-codes-de-secours.txt';

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);

    return true;
  } catch {
    return false;
  }
}

/** Offers the codes as a plain `.txt` — a printable copy is the whole point. */
function downloadRecoveryCodes(codes: string[]): void {
  const body = [
    'Codes de secours KeyHome',
    '',
    ...codes,
    '',
    "Chaque code ne fonctionne qu'une seule fois. Conservez-les hors de votre téléphone.",
    '',
  ].join('\n');

  const url = URL.createObjectURL(
    new Blob([body], { type: 'text/plain;charset=utf-8' })
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = RECOVERY_FILE_NAME;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Shared styling for the compact row actions, matching `LinkedAccountsCard`. */
const rowButtonSx = {
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.75rem',
  borderRadius: 2,
  minWidth: 80,
  boxShadow: 'none',
} as const;

/**
 * TOTP enrolment for the account settings — the client `/parametres` page and
 * the owner `/owner/security` page mount the very same card, so the two spaces
 * cannot drift apart. Colours come from the surrounding theme (`primary` is
 * teal inside the owner shell), hence no accent prop.
 *
 * Enrolment mirrors the admin panel: `startTotp` only mints a *pending* secret,
 * nothing is persisted until `confirmTotp` succeeds — abandoning the panel
 * leaves the account exactly as it was. Recovery codes are returned once, in
 * plaintext, and never again: the API only stores their hashes.
 */
export default function TwoFactorCard() {
  const [status, setStatus] = useState<MfaStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [setup, setSetup] = useState<TotpSetupStartResponse | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );
  const [confirmCode, setConfirmCode] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await mfaService.status());
    } catch (err) {
      setError(
        mfaErrorMessage(
          err,
          "Impossible de charger l'état de la vérification en deux étapes."
        )
      );
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => setCopied(false), 2000);

    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async (text: string) => {
    if (await copyToClipboard(text)) {
      setCopied(true);
    }
  };

  const handleStart = async () => {
    setError('');
    setSuccess('');
    setPending('start');

    try {
      setSetup(await mfaService.startTotp());
      setCode('');
    } catch (err) {
      setError(
        mfaErrorMessage(
          err,
          'Impossible de démarrer la configuration. Réessayez dans un instant.'
        )
      );
    } finally {
      setPending(null);
    }
  };

  const handleConfirm = async () => {
    if (code.length !== 6 || pending !== null) {
      return;
    }

    setError('');
    setPending('confirm');

    try {
      const data = await mfaService.confirmTotp(code);

      setRecoveryCodes(data.recovery_codes);
      setSetup(null);
      setCode('');
      setSuccess('Vérification en deux étapes activée.');
      await loadStatus();
    } catch (err) {
      setError(
        mfaErrorMessage(
          err,
          'Code incorrect. Vérifiez le code affiché dans votre application puis réessayez.'
        )
      );
      setCode('');
    } finally {
      setPending(null);
    }
  };

  const openConfirm = (action: ConfirmAction) => {
    setError('');
    setSuccess('');
    setConfirmAction(action);
    setConfirmCode('');
    setConfirmError('');
  };

  const closeConfirm = () => {
    setConfirmAction(null);
    setConfirmCode('');
    setConfirmError('');
  };

  /**
   * Both destructive actions ask for a fresh factor first, and both accept a
   * recovery code — a user whose phone is lost must still be able to turn the
   * second factor off.
   */
  const runConfirmedAction = async () => {
    const submitted = confirmCode.trim().toUpperCase();

    if (confirmAction === null || submitted.length < 6 || pending !== null) {
      return;
    }

    setConfirmError('');
    setPending(confirmAction);

    try {
      if (confirmAction === 'disable') {
        await mfaService.disableTotp(submitted);
        setRecoveryCodes([]);
        setSuccess('Vérification en deux étapes désactivée.');
      } else {
        const data = await mfaService.regenerateRecoveryCodes(submitted);

        setRecoveryCodes(data.recovery_codes);
        setSuccess(
          'Nouveaux codes de secours générés. Les anciens ne fonctionnent plus.'
        );
      }

      closeConfirm();
      await loadStatus();
    } catch (err) {
      setConfirmError(
        mfaErrorMessage(
          err,
          'Code incorrect. Utilisez le code de votre application ou un code de secours.'
        )
      );
    } finally {
      setPending(null);
    }
  };

  const hasTotp = status?.methods.includes('totp') ?? false;
  const remainingCodes = status?.recovery_codes_remaining ?? 0;
  const isBusy = pending !== null;

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 0 }}>
        {/* ── En-tête ── */}
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: 'block', fontWeight: 700 }}
          >
            Vérification en deux étapes
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Un code à usage unique s&apos;ajoute à votre mot de passe à chaque
            connexion.
          </Typography>
        </Box>

        {/* ── Messages de feedback ── */}
        {error && (
          <AppAlert
            severity="error"
            onClose={() => setError('')}
            sx={{ mx: 2, mb: 1 }}
            message={error}
          />
        )}
        {success && (
          <AppAlert
            severity="success"
            onClose={() => setSuccess('')}
            sx={{ mx: 2, mb: 1 }}
            message={success}
          />
        )}
        {status?.mfa_required && !hasTotp && (
          <AppAlert
            severity="warning"
            sx={{ mx: 2, mb: 1 }}
            message="Votre rôle exige une vérification en deux étapes : activez-la dès maintenant."
          />
        )}

        <Divider />

        <Box sx={{ px: 2, py: 1 }}>
          {isLoadingStatus ? (
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}
            >
              <Skeleton variant="circular" width={38} height={38} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="45%" />
                <Skeleton variant="text" width="70%" />
              </Box>
              <Skeleton variant="rounded" width={80} height={30} />
            </Box>
          ) : (
            <>
              {/* ── Application d'authentification (TOTP) ── */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    bgcolor: hasTotp
                      ? 'rgba(46,125,50,0.08)'
                      : 'rgba(0,0,0,0.04)',
                    color: hasTotp ? 'success.main' : 'text.secondary',
                  }}
                >
                  <ShieldIcon sx={{ fontSize: 20 }} />
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      Application d&apos;authentification
                    </Typography>
                    {hasTotp && (
                      <CheckCircleIcon
                        sx={{ fontSize: 14, color: 'success.main' }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {hasTotp
                      ? 'Activée — code à 6 chiffres à chaque connexion'
                      : 'Google Authenticator, Authy, 1Password…'}
                  </Typography>
                </Box>

                {hasTotp ? (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    disabled={isBusy}
                    onClick={() => openConfirm('disable')}
                    sx={rowButtonSx}
                  >
                    Désactiver
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={isBusy || setup !== null}
                    onClick={() => void handleStart()}
                    sx={rowButtonSx}
                  >
                    {pending === 'start' ? (
                      <ButtonSpinner size={14} />
                    ) : (
                      'Activer'
                    )}
                  </Button>
                )}
              </Box>
              {/* ── Codes de secours (uniquement si le TOTP est actif) ── */}
              {hasTotp && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      bgcolor: 'rgba(0,0,0,0.04)',
                      color:
                        remainingCodes > 0 ? 'text.secondary' : 'error.main',
                    }}
                  >
                    <VpnKeyIcon sx={{ fontSize: 20 }} />
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      Codes de secours
                    </Typography>
                    <Typography
                      variant="caption"
                      color={
                        remainingCodes > 0 ? 'text.secondary' : 'error.main'
                      }
                      noWrap
                    >
                      {remainingCodes > 0
                        ? `${remainingCodes} code${remainingCodes > 1 ? 's' : ''} encore utilisable${remainingCodes > 1 ? 's' : ''}`
                        : 'Aucun code restant — régénérez-les sans attendre'}
                    </Typography>
                  </Box>

                  <Tooltip
                    title="Un code de votre application sera demandé"
                    arrow
                  >
                    <span>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        disabled={isBusy}
                        onClick={() => openConfirm('regenerate')}
                        sx={rowButtonSx}
                      >
                        Régénérer
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* ── Configuration en cours : secret en attente, rien n'est encore actif ── */}
        {setup && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                1. Scannez ce QR code
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1.5 }}
              >
                Ouvrez Google Authenticator (ou une application équivalente)
                puis ajoutez un compte en scannant l&apos;image.
              </Typography>

              {setup.qr_code ? (
                <Box
                  component="img"
                  src={setup.qr_code}
                  alt="QR code à scanner avec votre application d'authentification"
                  sx={{
                    width: 172,
                    height: 172,
                    display: 'block',
                    mb: 2,
                    p: 1,
                    bgcolor: '#fff',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              ) : (
                <AppAlert
                  severity="info"
                  sx={{ mb: 2 }}
                  message="QR code indisponible : saisissez la clé ci-dessous à la main."
                />
              )}

              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                …ou saisissez la clé à la main
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    fontFamily: 'monospace',
                    letterSpacing: '0.08em',
                    wordBreak: 'break-all',
                  }}
                >
                  {setup.secret}
                </Typography>
                <Tooltip title={copied ? 'Copié' : 'Copier la clé'} arrow>
                  <IconButton
                    size="small"
                    aria-label="Copier la clé de configuration"
                    onClick={() => void handleCopy(setup.secret)}
                  >
                    <ContentCopyIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                2. Confirmez avec le code affiché
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Code à 6 chiffres"
                placeholder="000000"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleConfirm();
                  }
                }}
                autoComplete="one-time-code"
                disabled={isBusy}
                slotProps={{
                  htmlInput: {
                    inputMode: 'numeric',
                    maxLength: 6,
                    style: {
                      textAlign: 'center',
                      fontSize: '1.15rem',
                      fontWeight: 600,
                      letterSpacing: '0.35em',
                    },
                  },
                }}
                sx={{ mb: 1.5, maxWidth: 220 }}
              />

              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  disabled={code.length !== 6 || isBusy}
                  onClick={() => void handleConfirm()}
                  sx={rowButtonSx}
                >
                  {pending === 'confirm' ? (
                    <ButtonSpinner size={14} />
                  ) : (
                    'Confirmer'
                  )}
                </Button>
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  disabled={isBusy}
                  onClick={() => {
                    setSetup(null);
                    setCode('');
                  }}
                  sx={{ ...rowButtonSx, color: 'text.secondary' }}
                >
                  Annuler
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Cette configuration expire dans {setup.expires_in_minutes}{' '}
                minutes. Rien n&apos;est activé avant votre confirmation.
              </Typography>
            </Box>
          </>
        )}

        {/* ── Codes de secours : affichés une seule fois, l'API n'en garde que les hachages ── */}
        {recoveryCodes.length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 2 }}>
              <AppAlert
                severity="warning"
                sx={{ mb: 1.5 }}
                message="Notez ces codes maintenant : ils ne seront plus jamais affichés."
                hint="Chaque code ne fonctionne qu'une seule fois et remplace le code de votre application si vous perdez votre téléphone."
              />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                  gap: 1,
                  mb: 1.5,
                }}
              >
                {recoveryCodes.map((recoveryCode) => (
                  <Typography
                    key={recoveryCode}
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      textAlign: 'center',
                      px: 1,
                      py: 0.75,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                    }}
                  >
                    {recoveryCode}
                  </Typography>
                ))}
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                  onClick={() => void handleCopy(recoveryCodes.join('\n'))}
                  sx={rowButtonSx}
                >
                  {copied ? 'Copié' : 'Copier'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                  onClick={() => downloadRecoveryCodes(recoveryCodes)}
                  sx={rowButtonSx}
                >
                  Télécharger
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => setRecoveryCodes([])}
                  sx={rowButtonSx}
                >
                  J&apos;ai enregistré mes codes
                </Button>
              </Box>
            </Box>
          </>
        )}

        {/* ── Confirmation : un facteur frais est exigé avant toute action sensible ── */}
        <Dialog
          open={confirmAction !== null}
          onClose={isBusy ? undefined : closeConfirm}
          fullWidth
          maxWidth="xs"
          slotProps={{ paper: { sx: { borderRadius: 3 } } }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
            {confirmAction === 'disable'
              ? 'Désactiver la vérification en deux étapes ?'
              : 'Régénérer les codes de secours ?'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {confirmAction === 'disable'
                ? 'Votre compte ne sera plus protégé que par votre mot de passe.'
                : 'Les codes actuels seront invalidés et remplacés par de nouveaux codes, affichés une seule fois.'}
            </Typography>

            {confirmError && (
              <AppAlert
                severity="error"
                sx={{ mb: 2 }}
                message={confirmError}
              />
            )}

            <TextField
              fullWidth
              autoFocus
              size="small"
              label="Code de l'application ou code de secours"
              placeholder="000000"
              value={confirmCode}
              onChange={(event) =>
                setConfirmCode(
                  event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9-]/g, '')
                    .slice(0, 11)
                )
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void runConfirmedAction();
                }
              }}
              autoComplete="one-time-code"
              disabled={isBusy}
              slotProps={{
                htmlInput: {
                  maxLength: 11,
                  style: { letterSpacing: '0.14em', fontWeight: 600 },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              size="small"
              variant="text"
              color="inherit"
              disabled={isBusy}
              onClick={closeConfirm}
              sx={{ ...rowButtonSx, color: 'text.secondary' }}
            >
              Annuler
            </Button>
            <Button
              size="small"
              variant="contained"
              color={confirmAction === 'disable' ? 'error' : 'primary'}
              disabled={confirmCode.trim().length < 6 || isBusy}
              onClick={() => void runConfirmedAction()}
              sx={rowButtonSx}
            >
              {isBusy ? (
                <ButtonSpinner size={14} />
              ) : confirmAction === 'disable' ? (
                'Désactiver'
              ) : (
                'Régénérer'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
