'use client';

import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import KhSnackbar from '@/components/ui/feedback/KhSnackbar';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { ownerService, type LeaseContract } from '@/services/owner.service';
import {
  Archive as ArchiveIcon,
  Cancel as TerminateIcon,
  MoreVert as MoreIcon,
  Refresh as RenewIcon,
} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type MouseEvent, type ReactElement } from 'react';

interface LeaseLifecycleMenuProps {
  contract: LeaseContract;
}

type DialogKind = 'renew' | 'terminate' | 'archive' | null;

/**
 * Overflow menu wrapping the three lifecycle actions (renew / terminate
 * / archive). Each opens its own confirmation dialog. On success the
 * shared owner-lease list query is invalidated so the parent re-fetches.
 */
export default function LeaseLifecycleMenu({
  contract,
}: LeaseLifecycleMenuProps): ReactElement {
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [extendMonths, setExtendMonths] = useState<number>(12);
  const [monthlyRent, setMonthlyRent] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const open = Boolean(anchorEl);
  const handleOpen = (e: MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const closeDialog = () => {
    setDialog(null);
    setExtendMonths(12);
    setMonthlyRent('');
    setReason('');
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['owner-lease-contracts'] });
    queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
  };

  const renewMutation = useMutation({
    mutationFn: () =>
      ownerService.renewLeaseContract(contract.id, {
        extend_months: extendMonths,
        ...(monthlyRent !== '' ? { monthly_rent: Number(monthlyRent) } : {}),
      }),
    onSuccess: () => {
      invalidate();
      setSnackbar({
        message: `Bail renouvelé (+${extendMonths} mois)`,
        severity: 'success',
      });
      closeDialog();
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getSafeErrorMessage(err) || 'Erreur lors du renouvellement',
        severity: 'error',
      });
    },
  });

  const terminateMutation = useMutation({
    mutationFn: () =>
      ownerService.terminateLeaseContract(contract.id, { reason }),
    onSuccess: () => {
      invalidate();
      setSnackbar({ message: 'Bail résilié', severity: 'success' });
      closeDialog();
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getSafeErrorMessage(err) || 'Erreur lors de la résiliation',
        severity: 'error',
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => ownerService.archiveLeaseContract(contract.id),
    onSuccess: () => {
      invalidate();
      setSnackbar({ message: 'Bail archivé', severity: 'success' });
      closeDialog();
    },
    onError: (err: unknown) => {
      setSnackbar({
        message: getSafeErrorMessage(err) || "Erreur lors de l'archivage",
        severity: 'error',
      });
    },
  });

  const canRenew =
    contract.status !== 'terminated' && contract.status !== 'archived';
  const canTerminate =
    contract.status !== 'terminated' && contract.status !== 'archived';
  const canArchive =
    contract.status === 'expired' || contract.status === 'terminated';

  return (
    <>
      <IconButton
        aria-label="Actions sur le contrat"
        size="small"
        onClick={handleOpen}
        sx={{ borderRadius: 1.5 }}
      >
        <MoreIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 200 } } }}
      >
        <MenuItem
          disabled={!canRenew}
          onClick={() => {
            handleClose();
            setDialog('renew');
          }}
        >
          <ListItemIcon>
            <RenewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Renouveler</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={!canTerminate}
          onClick={() => {
            handleClose();
            setDialog('terminate');
          }}
        >
          <ListItemIcon>
            <TerminateIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Résilier</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={!canArchive}
          onClick={() => {
            handleClose();
            setDialog('archive');
          }}
        >
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archiver</ListItemText>
        </MenuItem>
      </Menu>

      {/* Renew */}
      <Dialog
        open={dialog === 'renew'}
        onClose={() => {
          if (renewMutation.isPending) return;
          closeDialog();
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Renouveler le bail</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Mois supplémentaires *"
              type="number"
              value={extendMonths}
              onChange={(e) =>
                setExtendMonths(Math.max(1, Number(e.target.value)))
              }
              fullWidth
              autoFocus
              inputProps={{ min: 1, max: 120 }}
              helperText="Entre 1 et 120 mois — ajouté à la fin du bail actuel."
            />
            <TextField
              label="Nouveau loyer mensuel (XAF)"
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              fullWidth
              inputProps={{ min: 0 }}
              helperText="Laissez vide pour conserver le loyer actuel."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={closeDialog}
            variant="outlined"
            disabled={renewMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => renewMutation.mutate()}
            variant="contained"
            disabled={renewMutation.isPending || extendMonths < 1}
            startIcon={
              renewMutation.isPending ? <ButtonSpinner size={16} /> : null
            }
            sx={{ borderRadius: 2 }}
          >
            Renouveler
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terminate */}
      <Dialog
        open={dialog === 'terminate'}
        onClose={() => {
          if (terminateMutation.isPending) return;
          closeDialog();
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Résilier le bail</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            La résiliation est définitive. Le loyer ne sera plus comptabilisé
            dans le tableau de bord.
          </DialogContentText>
          <TextField
            label="Motif de la résiliation *"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            inputProps={{ minLength: 3, maxLength: 1000 }}
            placeholder="Ex. Départ du locataire après préavis"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={closeDialog}
            variant="outlined"
            disabled={terminateMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => terminateMutation.mutate()}
            variant="contained"
            color="error"
            disabled={terminateMutation.isPending || reason.trim().length < 3}
            startIcon={
              terminateMutation.isPending ? <ButtonSpinner size={16} /> : null
            }
            sx={{ borderRadius: 2 }}
          >
            Résilier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive */}
      <Dialog
        open={dialog === 'archive'}
        onClose={() => {
          if (archiveMutation.isPending) return;
          closeDialog();
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Archiver le bail ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Le bail sera masqué des tableaux de bord actifs mais conservé pour
            la comptabilité et l&apos;audit.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeDialog}
            variant="outlined"
            disabled={archiveMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => archiveMutation.mutate()}
            variant="contained"
            disabled={archiveMutation.isPending}
            startIcon={
              archiveMutation.isPending ? <ButtonSpinner size={16} /> : null
            }
            sx={{ borderRadius: 2 }}
          >
            Archiver
          </Button>
        </DialogActions>
      </Dialog>

      <KhSnackbar
        open={Boolean(snackbar)}
        message={snackbar?.message ?? null}
        severity={snackbar?.severity ?? 'success'}
        onClose={() => setSnackbar(null)}
        duration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
