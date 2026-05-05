'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  LinearProgress,
  Alert,
  Collapse,
} from '@mui/material';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useState } from 'react';

interface SessionTimeoutModalProps {
  open: boolean;
  secondsLeft: number;
  countdownTotal: number;
  onExtend: () => void | Promise<void>;
  onLogout: () => void;
  /** When true, the refresh failed — shows an error banner before redirect. */
  refreshError?: boolean;
  /**
   * Owner panel (teal theme): progress ring, top bar, icon and countdown use
   * primary instead of warning/error so the modal matches bailleur branding.
   */
  useOwnerAccent?: boolean;
}

export default function SessionTimeoutModal({
  open,
  secondsLeft,
  countdownTotal,
  onExtend,
  onLogout,
  refreshError = false,
  useOwnerAccent = false,
}: SessionTimeoutModalProps) {
  const [extending, setExtending] = useState(false);

  const progress = (secondsLeft / countdownTotal) * 100;
  const isBlocked = extending || refreshError;

  const accentStrong = useOwnerAccent
    ? progress > 30
      ? 'primary.main'
      : 'primary.dark'
    : progress > 30
      ? 'warning.main'
      : 'error.main';

  const handleExtend = async () => {
    if (isBlocked) return;
    setExtending(true);
    try {
      await onExtend();
    } finally {
      setExtending(false);
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgba(0,0,0,0.55)' },
        },
      }}
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' },
      }}
    >
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
          '& .MuiLinearProgress-bar': {
            bgcolor: accentStrong,
            transition: 'transform 1s linear',
          },
        }}
      />

      <DialogTitle sx={{ textAlign: 'center', pb: 0, pt: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
            <CircularProgress
              variant="determinate"
              value={progress}
              size={72}
              thickness={3}
              sx={{ color: accentStrong }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TimerOffIcon
                sx={{
                  fontSize: 28,
                  color: accentStrong,
                }}
              />
            </Box>
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Session bientôt expirée
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', pt: 1.5 }}>
        <Collapse in={refreshError} unmountOnExit>
          <Alert
            severity="error"
            icon={<ErrorOutlineIcon fontSize="small" />}
            sx={{ mb: 2, borderRadius: 2, textAlign: 'left' }}
          >
            <Typography variant="body2" fontWeight={600}>
              Session expirée
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Votre session a expiré. Redirection vers la page de connexion…
            </Typography>
          </Alert>
        </Collapse>

        <Collapse in={!refreshError} unmountOnExit>
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Votre session sera automatiquement fermée dans
            </Typography>
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                color: accentStrong,
                fontVariantNumeric: 'tabular-nums',
                mb: 1,
              }}
            >
              {secondsLeft}s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              en raison d&apos;inactivité. Souhaitez-vous prolonger votre
              session ?
            </Typography>
          </>
        </Collapse>
      </DialogContent>

      <DialogActions
        sx={{ px: 3, pb: 3, pt: 1, flexDirection: 'column', gap: 1 }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={handleExtend}
          disabled={isBlocked}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 99,
            py: 1.2,
            background: (t) =>
              `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
          }}
        >
          {extending ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color="inherit" thickness={4} />
              Prolongation…
            </Box>
          ) : (
            'Prolonger la session'
          )}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          onClick={onLogout}
          disabled={extending}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 99,
            py: 1,
            color: 'text.secondary',
            borderColor: 'divider',
          }}
        >
          Se déconnecter
        </Button>
      </DialogActions>
    </Dialog>
  );
}
