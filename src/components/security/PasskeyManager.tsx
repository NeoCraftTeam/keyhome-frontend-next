'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import EmptyState from '@/components/ui/feedback/EmptyState';
import FadeIn from '@/components/ui/layout/FadeIn';
import KhSnackbar from '@/components/ui/feedback/KhSnackbar';
import { usePasskeyManager } from '@/hooks/usePasskey';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { formatWebAuthnClientError } from '@/lib/auth/passkey-support';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import Key from '@mui/icons-material/Key';
import Refresh from '@mui/icons-material/Refresh';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useState } from 'react';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getDefaultAlias(): string {
  if (typeof navigator === 'undefined') return 'Mon appareil';
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Macintosh/i.test(ua)) return 'MacBook';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'PC Windows';
  return 'Mon appareil';
}

interface PasskeyManagerProps {
  /** Semantic panel; colors follow the active MUI theme (client pink / owner teal). */
  variant?: 'client' | 'owner';
}

export default function PasskeyManager({
  variant: _variant = 'client',
}: PasskeyManagerProps) {
  void _variant;
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark ?? theme.palette.primary.main;
  const primarySoft = alpha(primary, 0.12);
  const primaryHover = alpha(primary, 0.08);

  const {
    supported,
    unsupportedReason,
    passkeys,
    isLoading,
    isError,
    listError,
    refetch,
    register,
    isRegistering,
    rename,
    isRenaming,
    remove,
    isDeleting,
  } = usePasskeyManager();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlias, setNewAlias] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editAlias, setEditAlias] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  if (!supported) {
    return (
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
            <FingerprintIcon sx={{ color: primary }} />
            <Typography variant="h6" fontWeight={700}>
              Passkeys
            </Typography>
          </Stack>
          <AppAlert
            severity="info"
            message={
              unsupportedReason ??
              'Les passkeys ne sont pas disponibles dans cet environnement.'
            }
          />
        </CardContent>
      </Card>
    );
  }

  const handleRegister = async (): Promise<void> => {
    try {
      const alias = newAlias.trim() || getDefaultAlias();
      await register(alias);
      setShowAddForm(false);
      setNewAlias('');
      setSnackbar({
        message: 'Passkey ajoutée avec succès !',
        severity: 'success',
      });
    } catch (err: unknown) {
      setSnackbar({
        message: formatWebAuthnClientError(
          err,
          getSafeErrorMessage(err, "Erreur lors de l'ajout de la passkey.")
        ),
        severity: 'error',
      });
    }
  };

  const handleRename = async (): Promise<void> => {
    if (!editId || !editAlias.trim()) return;
    try {
      await rename({ id: editId, alias: editAlias.trim() });
      setEditId(null);
      setEditAlias('');
      setSnackbar({ message: 'Passkey renommée.', severity: 'success' });
    } catch (err: unknown) {
      setSnackbar({
        message: getSafeErrorMessage(err, 'Erreur lors du renommage.'),
        severity: 'error',
      });
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      setDeleteId(null);
      setSnackbar({ message: 'Passkey supprimée.', severity: 'success' });
    } catch (err: unknown) {
      setSnackbar({
        message: getSafeErrorMessage(err, 'Erreur lors de la suppression.'),
        severity: 'error',
      });
    }
  };

  const listErrorMessage = listError
    ? getSafeErrorMessage(
        listError,
        'Impossible de charger la liste des passkeys.'
      )
    : 'Impossible de charger la liste des passkeys.';

  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <FingerprintIcon sx={{ color: primary }} />
              <Typography variant="h6" fontWeight={700}>
                Passkeys
              </Typography>
            </Stack>
            {!showAddForm && !isError && (
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  setNewAlias(getDefaultAlias());
                  setShowAddForm(true);
                }}
                disabled={isRegistering}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  color: primary,
                  '&:hover': { bgcolor: primaryHover },
                }}
              >
                Ajouter
              </Button>
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Connectez-vous rapidement avec votre empreinte digitale, Face ID ou
            clé de sécurité.
          </Typography>

          {isError && (
            <AppAlert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={() => void refetch()}
                >
                  Réessayer
                </Button>
              }
              message={listErrorMessage}
            />
          )}

          {/* ── Add form ── */}
          {showAddForm && !isError && (
            <FadeIn>
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Nommer cette passkey
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="ex: MacBook Pro, iPhone 15…"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleRegister();
                  }}
                  disabled={isRegistering}
                  sx={{ mb: 1.5 }}
                />
                <Stack direction="row" gap={1} justifyContent="flex-end">
                  <Button
                    size="small"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewAlias('');
                    }}
                    disabled={isRegistering}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      isRegistering ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <FingerprintIcon />
                      )
                    }
                    onClick={() => void handleRegister()}
                    disabled={isRegistering}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      bgcolor: primary,
                      '&:hover': { bgcolor: primaryDark },
                    }}
                  >
                    {isRegistering ? 'Validation…' : 'Enregistrer'}
                  </Button>
                </Stack>
              </Box>
            </FadeIn>
          )}

          {/* ── List ── */}
          {!isError &&
            (isLoading ? (
              <Stack gap={1}>
                {[1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={56}
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Stack>
            ) : passkeys.length === 0 ? (
              <EmptyState
                title="Aucune passkey"
                description="Ajoutez une passkey pour vous connecter sans mot de passe."
                size="sm"
              />
            ) : (
              <Stack gap={1}>
                {passkeys.map((passkey) => (
                  <Box
                    key={passkey.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      transition: 'background-color 0.15s',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        bgcolor: primarySoft,
                        flexShrink: 0,
                      }}
                    >
                      <Key sx={{ fontSize: 18, color: primary }} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {editId === passkey.id ? (
                        <Stack direction="row" gap={0.5} alignItems="center">
                          <TextField
                            size="small"
                            value={editAlias}
                            onChange={(e) => setEditAlias(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void handleRename();
                              if (e.key === 'Escape') setEditId(null);
                            }}
                            disabled={isRenaming}
                            sx={{ flex: 1 }}
                            autoFocus
                          />
                          <Button
                            size="small"
                            onClick={() => void handleRename()}
                            disabled={isRenaming || !editAlias.trim()}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              minWidth: 'auto',
                            }}
                          >
                            OK
                          </Button>
                        </Stack>
                      ) : (
                        <>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {passkey.alias || 'Passkey sans nom'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ajoutée le {formatDate(passkey.created_at)}
                          </Typography>
                        </>
                      )}
                    </Box>

                    {passkey.disabled && (
                      <Chip
                        size="small"
                        label="Désactivée"
                        color="warning"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}

                    {editId !== passkey.id && (
                      <Stack direction="row" gap={0.25}>
                        <Tooltip title="Renommer">
                          <IconButton
                            size="small"
                            aria-label="Renommer cette passkey"
                            onClick={() => {
                              setEditId(passkey.id);
                              setEditAlias(passkey.alias || '');
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="Supprimer cette passkey"
                            onClick={() => setDeleteId(passkey.id)}
                            disabled={isDeleting}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Box>
                ))}
              </Stack>
            ))}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Supprimer cette passkey ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vous ne pourrez plus vous connecter avec cette passkey. Vous devrez
            également la supprimer manuellement depuis les paramètres de votre
            appareil.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteId(null)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <KhSnackbar
        open={Boolean(snackbar)}
        message={snackbar?.message ?? null}
        severity={snackbar?.severity ?? 'info'}
        onClose={() => setSnackbar(null)}
      />
    </>
  );
}
