'use client';

import { brandAgent } from '@/theme/tokens';
import { Warning as WarningIcon } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from '@mui/material';
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return ctx.confirm;
}

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

export function ConfirmDialogProvider({
  children,
}: ConfirmDialogProviderProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null
  );

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setLoading(false);
    resolver?.(false);
    setResolver(null);
  }, [resolver]);

  const handleConfirm = useCallback(() => {
    setLoading(true);
    resolver?.(true);
    setResolver(null);
    setTimeout(() => {
      setOpen(false);
      setLoading(false);
    }, 150);
  }, [resolver]);

  const variantColors = {
    danger: { bg: 'error.main', hover: 'error.dark' },
    warning: { bg: 'warning.main', hover: 'warning.dark' },
    info: { bg: brandAgent.primary, hover: brandAgent.primaryDark },
  };

  const colors = variantColors[options?.variant ?? 'danger'];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        PaperProps={{
          sx: { borderRadius: 3, maxWidth: 400 },
        }}
      >
        <DialogTitle
          id="confirm-dialog-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            fontWeight: 700,
          }}
        >
          <WarningIcon
            sx={{
              color:
                options?.variant === 'info'
                  ? brandAgent.primary
                  : 'warning.main',
            }}
          />
          {options?.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            {options?.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {options?.cancelLabel ?? 'Annuler'}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: colors.bg,
              '&:hover': { bgcolor: colors.hover },
              minWidth: 100,
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              (options?.confirmLabel ?? 'Confirmer')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
