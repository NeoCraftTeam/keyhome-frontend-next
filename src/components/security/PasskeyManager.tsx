'use client';

import EmptyState from '@/components/ui/EmptyState';
import FadeIn from '@/components/ui/FadeIn';
import { usePasskeyManager } from '@/hooks/usePasskey';
import { getSafeErrorMessage } from '@/lib/error-messages';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import Key from '@mui/icons-material/Key';
import {
  Alert,
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
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
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
  variant?: 'client' | 'owner';
}

const BRAND = {
  client: {
    main: '#F6475F',
    dark: '#d93d52',
    bg: 'rgba(246, 71, 95, 0.1)',
    hover: 'rgba(246, 71, 95, 0.08)',
  },
  owner: {
    main: '#0D9488',
    dark: '#0b7e73',
    bg: 'rgba(13, 148, 136, 0.1)',
    hover: 'rgba(13, 148, 136, 0.08)',
  },
} as const;

export default function PasskeyManager({
  variant = 'client',
}: PasskeyManagerProps) {
  const c = BRAND[variant];
  const {
    supported,
    passkeys,
    isLoading,
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

  if (!supported) return null;

  const handleRegister = async () => {
    try {
      const alias = newAlias.trim() || getDefaultAlias();
      await register(alias);
      setShowAddForm(false);
      setNewAlias('');
      setSnackbar({
        message: 'Passkey ajoutée avec succès !',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        message: getSafeErrorMessage(
          err,
          "Erreur lors de l'ajout de la passkey."
        ),
        severity: 'error',
      });
    }
  };

  const handleRename = async () => {
    if (!editId || !editAlias.trim()) return;
    try {
      await rename({ id: editId, alias: editAlias.trim() });
      setEditId(null);
      setEditAlias('');
      setSnackbar({ message: 'Passkey renommée.', severity: 'success' });
    } catch (err) {
      setSnackbar({
        message: getSafeErrorMessage(err, 'Erreur lors du renommage.'),
        severity: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      setDeleteId(null);
      setSnackbar({ message: 'Passkey supprimée.', severity: 'success' });
    } catch (err) {
      setSnackbar({
        message: getSafeErrorMessage(err, 'Erreur lors de la suppression.'),
        severity: 'error',
      });
    }
  };

  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
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
              <FingerprintIcon sx={{ color: c.main }} />
              <Typography variant="h6" fontWeight={700}>
                Passkeys
              </Typography>
            </Stack>
            {!showAddForm && (
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
                  color: c.main,
                  '&:hover': { bgcolor: c.hover },
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

          {/* ── Add form ── */}
          {showAddForm && (
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
                    if (e.key === 'Enter') handleRegister();
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
                    onClick={handleRegister}
                    disabled={isRegistering}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      bgcolor: c.main,
                      '&:hover': { bgcolor: c.dark },
                    }}
                  >
                    {isRegistering ? 'Validation…' : 'Enregistrer'}
                  </Button>
                </Stack>
              </Box>
            </FadeIn>
          )}

          {/* ── List ── */}
          {isLoading ? (
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
                      bgcolor: c.bg,
                      flexShrink: 0,
                    }}
                  >
                    <Key sx={{ fontSize: 18, color: c.main }} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {editId === passkey.id ? (
                      <Stack direction="row" gap={0.5} alignItems="center">
                        <TextField
                          size="small"
                          value={editAlias}
                          onChange={(e) => setEditAlias(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') setEditId(null);
                          }}
                          disabled={isRenaming}
                          sx={{ flex: 1 }}
                          autoFocus
                        />
                        <Button
                          size="small"
                          onClick={handleRename}
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
          )}
        </CardContent>
      </Card>

      {/* ── Confirm Delete Dialog ── */}
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
            onClick={handleDelete}
            disabled={isDeleting}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity={snackbar?.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
