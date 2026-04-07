'use client';

import { trustScoreService } from '@/services/trust-score.service';
import ShieldIcon from '@mui/icons-material/VerifiedUser';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

interface TrustScoreConsentModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TrustScoreConsentModal({
  open,
  onClose,
}: TrustScoreConsentModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const consentMutation = useMutation({
    mutationFn: (consent: boolean) => trustScoreService.consent(consent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust-score'] });
      onClose();
    },
    onError: () => {
      setError('Une erreur est survenue. Veuillez reessayer.');
    },
  });

  const handleAccept = useCallback(() => {
    setError(null);
    consentMutation.mutate(true);
  }, [consentMutation]);

  const handleDecline = useCallback(() => {
    setError(null);
    consentMutation.mutate(false);
  }, [consentMutation]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShieldIcon sx={{ color: '#0D9488' }} />
        Score de confiance KeyHome
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Le Score de confiance KeyHome est un indicateur de fiabilite calcule a
          partir de votre activite sur la plateforme. Il aide les bailleurs et
          locataires a se faire confiance mutuellement.
        </Typography>

        <Box
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 2,
            p: 2,
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Ce que nous analysons :
          </Typography>
          <Typography variant="body2" component="div">
            - Historique de paiements
            <br />
            - Assiduite aux visites
            <br />
            - Completude du profil
            <br />
            - Avis recus
            <br />
            - Anciennete du compte
            <br />
            - Documents fournis
            <br />- Verifications (email, telephone)
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Vous pouvez desactiver votre score a tout moment depuis votre profil.
          Vos donnees restent confidentielles et ne sont jamais partagees avec
          des tiers.
        </Typography>

        {error && (
          <Typography variant="body2" sx={{ color: 'error.main', mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleDecline}
          disabled={consentMutation.isPending}
          color="inherit"
        >
          Non merci
        </Button>
        <Button
          onClick={handleAccept}
          disabled={consentMutation.isPending}
          variant="contained"
          sx={{
            bgcolor: '#0D9488',
            '&:hover': { bgcolor: '#0F766E' },
          }}
        >
          {consentMutation.isPending ? 'Activation...' : 'Activer mon score'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
