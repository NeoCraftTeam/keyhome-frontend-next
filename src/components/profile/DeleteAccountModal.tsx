'use client';

import { getSafeErrorMessage } from '@/lib/error-messages';
import { brand, brandAgent } from '@/theme/tokens';
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
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';

const CONFIRMATION_PHRASE = 'SUPPRIMER MON COMPTE';

export type DeleteAccountModalVariant = 'client' | 'owner';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Client = particulier (crédits, favoris…). Owner = bailleur/agence (abonnement, annonces…). */
  variant?: DeleteAccountModalVariant;
}

export default function DeleteAccountModal({
  open,
  onClose,
  variant = 'client',
}: Props) {
  const theme = useTheme();
  const { logout } = useAuth();
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

      await logout(isOwner ? '/owner/login' : '/home');
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

  const isOwner = variant === 'owner';
  const accentColor = isOwner ? brandAgent.primary : theme.palette.primary.main;
  const paperBg = isOwner ? '#FFFFFF' : '#FFF5F5';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: { sx: { bgcolor: 'rgba(15, 23, 42, 0.5)' } },
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: paperBg,
          backgroundImage: 'none',
          boxShadow: isOwner
            ? `0 20px 50px rgba(15, 23, 42, 0.12), 0 0 0 1px ${brandAgent.primaryAlpha20}`
            : undefined,
          border: isOwner ? `1px solid ${brandAgent.primaryLight}` : undefined,
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
          color: isOwner ? brandAgent.primaryDark : undefined,
        }}
      >
        <WarningAmberIcon
          sx={{
            color: isOwner ? brandAgent.primary : brand.primaryDark,
          }}
        />
        Supprimer le compte
      </DialogTitle>

      <DialogContent sx={{ pt: 2, bgcolor: paperBg }}>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          La suppression de votre compte est <strong>irréversible</strong>. Vous
          perdrez l&apos;accès à votre compte et vos données personnelles seront
          traitées conformément à notre politique de confidentialité
          (anonymisation, délais légaux).
        </Typography>

        {isOwner ? (
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Votre <strong>abonnement </strong> sera résilié immédiatement. Aucun
            remboursement ni avoir ne sera accordé pour la période en cours. Vos{' '}
            <strong>annonces</strong>, paiements en cours et données associées
            au compte professionnel seront impactés.
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Vos <strong>crédits</strong> seront{' '}
            <strong>perdus sans remboursement</strong>. Seront également
            supprimés ou anonymisés : favoris, annonces dont vous avez débloqué
            le contact, historiques de recherche, alertes, messages,
            réservations et le reste des données liées à votre compte
            particulier.
          </Typography>
        )}

        <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
          Pour confirmer, tapez{' '}
          <Box
            component="span"
            sx={{
              fontWeight: 800,
              color: accentColor,
              letterSpacing: 0.5,
            }}
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
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text');
            setInput((prev) => `${prev}${pasted.toLocaleLowerCase('fr-FR')}`);
          }}
          onDrop={(e) => e.preventDefault()}
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

      <DialogActions
        sx={{ px: 3, pb: 2.5, gap: 1, bgcolor: paperBg, flexWrap: 'wrap' }}
      >
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
