'use client';

import { getSafeErrorMessage } from '@/lib/error-messages';
import { useAuth } from '@/providers/AuthProvider';
import { usersService } from '@/services/users.service';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CONFIRMATION_PHRASE = 'SUPPRIMER MON COMPTE';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({ open, onClose }: Props) {
  const { logout } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMatch = input.trim() === CONFIRMATION_PHRASE;

  const handleDelete = async () => {
    if (!isMatch) return;
    setIsDeleting(true);
    setError(null);

    try {
      await usersService.deleteAccount(CONFIRMATION_PHRASE);

      // Wipe session fully then redirect to home
      await logout('/');
      router.replace('/');
    } catch (err) {
      setError(
        getSafeErrorMessage(
          err,
          'Une erreur est survenue lors de la suppression du compte.'
        )
      );
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setInput('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: '#FFF5F5',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 700,
          pb: 0,
        }}
      >
        <WarningAmberIcon color="error" />
        Supprimer le compte
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Nous supprimerons immédiatement <strong>TOUTES les données</strong>{' '}
          associées à votre compte. Vous ne pourrez pas récupérer vos données.
        </Typography>

        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Cela annulera immédiatement votre abonnement. Si vous êtes
          actuellement sur un compte payant, vous ne recevrez pas de
          remboursement.
        </Typography>

        <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
          Pour confirmer, tapez{' '}
          <Box
            component="span"
            sx={{ fontWeight: 800, color: 'error.main', letterSpacing: 0.5 }}
          >
            {CONFIRMATION_PHRASE}
          </Box>{' '}
          dans le champ ci-dessous.
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder={`Tapez ${CONFIRMATION_PHRASE} pour confirmer`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isDeleting}
          autoComplete="off"
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#fff',
            },
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={isDeleting}
          variant="outlined"
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          Annuler
        </Button>
        <Button
          onClick={handleDelete}
          disabled={!isMatch || isDeleting}
          variant="contained"
          color="error"
          startIcon={
            isDeleting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <DeleteForeverIcon />
            )
          }
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
            },
          }}
        >
          {isDeleting ? 'Suppression...' : 'Supprimer le compte'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
