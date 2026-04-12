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
} from '@mui/material';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import { useState } from 'react';

interface SessionTimeoutModalProps {
  open: boolean;
  secondsLeft: number;
  countdownTotal: number;
  onExtend: () => void | Promise<void>;
  onLogout: () => void;
}

export default function SessionTimeoutModal({
  open,
  secondsLeft,
  countdownTotal,
  onExtend,
  onLogout,
}: SessionTimeoutModalProps) {
  const [extending, setExtending] = useState(false);

  const progress = (secondsLeft / countdownTotal) * 100;

  const handleExtend = async () => {
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
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgba(0,0,0,0.5)' },
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
            bgcolor: progress > 30 ? 'warning.main' : 'error.main',
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
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
              mb: 1,
            }}
          >
            <CircularProgress
              variant="determinate"
              value={progress}
              size={72}
              thickness={3}
              sx={{
                color: progress > 30 ? 'warning.main' : 'error.main',
              }}
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
                  color: progress > 30 ? 'warning.main' : 'error.main',
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Votre session sera automatiquement fermée dans
        </Typography>
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            color: progress > 30 ? 'warning.main' : 'error.main',
            fontVariantNumeric: 'tabular-nums',
            mb: 1,
          }}
        >
          {secondsLeft}s
        </Typography>
        <Typography variant="body2" color="text.secondary">
          en raison d&apos;inactivité. Souhaitez-vous prolonger votre session ?
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1,
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={handleExtend}
          disabled={extending}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 99,
            py: 1.2,
            background: (t) =>
              `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
          }}
        >
          {extending ? 'Prolongation…' : 'Prolonger la session'}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          onClick={onLogout}
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
