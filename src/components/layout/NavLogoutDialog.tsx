'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface NavLogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function NavLogoutDialog({
  open,
  onClose,
  onConfirm,
}: NavLogoutDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: 3, px: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Se déconnecter ?
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Êtes-vous sûr(e) de vouloir vous déconnecter de votre compte KeyHome ?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ pb: 2, px: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600 }}
        >
          Annuler
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600 }}
        >
          Déconnexion
        </Button>
      </DialogActions>
    </Dialog>
  );
}
