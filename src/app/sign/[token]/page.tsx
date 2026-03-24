'use client';

import { ownerService, type LeaseContract, type SignatureRequest } from '@/services/owner.service';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Draw as DrawIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';

type SignatureData = SignatureRequest & { contract: LeaseContract };

function formatDate(s: string | null): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return s;
  }
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function SignPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [finalStatus, setFinalStatus] = useState<'signed' | 'declined' | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-signature', token],
    queryFn: () => ownerService.getPublicSignatureRequest(token),
    retry: false,
  });

  const signMutation = useMutation({
    mutationFn: () => ownerService.signSignatureRequest(token),
    onSuccess: () => {
      setSignDialogOpen(false);
      setFinalStatus('signed');
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => ownerService.declineSignatureRequest(token, declineReason || undefined),
    onSuccess: () => {
      setDeclineDialogOpen(false);
      setFinalStatus('declined');
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data?.request) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 3 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Lien invalide ou expiré
          </Typography>
          <Typography color="text.secondary">
            Ce lien de signature n&apos;est pas valide ou a expiré. Veuillez contacter le propriétaire.
          </Typography>
        </Box>
      </Box>
    );
  }

  const request: SignatureData = data.request;
  const contract = request.contract;

  const effectiveStatus = finalStatus ?? request.status;
  const expired = isExpired(request.expires_at) || effectiveStatus === 'expired';

  const isDone = effectiveStatus === 'signed' || effectiveStatus === 'declined' || expired;

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h5" fontWeight={800} color="primary" gutterBottom>
          KeyHome
        </Typography>
        <Typography variant="h6" fontWeight={600}>
          Signature de contrat de bail
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Bonjour <strong>{request.signer_name}</strong>, vous avez reçu une demande de signature.
        </Typography>
      </Box>

      {/* Contract Summary */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 4 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Détails du contrat
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            <InfoRow label="Locataire" value={contract.tenant_name} />
            <InfoRow label="Référence" value={contract.contract_number} />
            <InfoRow label="Loyer mensuel" value={`${contract.monthly_rent?.toLocaleString('fr-FR')} FCFA`} />
            <InfoRow label="Début du bail" value={formatDate(contract.lease_start)} />
            <InfoRow label="Fin du bail" value={formatDate(contract.lease_end)} />
          </Stack>
        </CardContent>
      </Card>

      {/* Status or Actions */}
      {isDone ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          {effectiveStatus === 'signed' ? (
            <>
              <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} color="success.main" gutterBottom>
                Contrat signé
              </Typography>
              <Typography color="text.secondary">
                Ce contrat a été signé le {formatDate(request.signed_at ?? new Date().toISOString())}.
              </Typography>
            </>
          ) : effectiveStatus === 'declined' ? (
            <>
              <CancelIcon sx={{ fontSize: 72, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} color="error.main" gutterBottom>
                Demande refusée
              </Typography>
              <Typography color="text.secondary">
                Vous avez refusé de signer ce contrat.
              </Typography>
            </>
          ) : (
            <>
              <ScheduleIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Lien expiré
              </Typography>
              <Typography color="text.secondary">
                Ce lien de signature a expiré. Contactez le propriétaire pour en obtenir un nouveau.
              </Typography>
            </>
          )}
        </Box>
      ) : (
        <Stack spacing={2}>
          <Alert severity="info">
            Lisez attentivement les détails du contrat ci-dessus avant de signer.
          </Alert>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
            En cliquant sur &quot;Je signe&quot;, vous confirmez avoir lu le contrat ci-dessus et vous engagez à en respecter les termes.
          </Typography>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<DrawIcon />}
            onClick={() => {
              setAcceptedTerms(false);
              setSignDialogOpen(true);
            }}
            sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', py: 1.5 }}
          >
            Je signe électroniquement ce contrat
          </Button>
          <Button
            variant="text"
            fullWidth
            onClick={() => {
              setDeclineReason('');
              setDeclineDialogOpen(true);
            }}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Refuser
          </Button>
        </Stack>
      )}

      {/* Sign Confirmation Dialog */}
      <Dialog
        open={signDialogOpen}
        onClose={() => setSignDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Confirmer la signature</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            En signant, vous acceptez les termes du contrat de bail <strong>{contract.contract_number}</strong>.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
            }
            label="J'ai lu et j'accepte les termes du contrat"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setSignDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => signMutation.mutate()}
            variant="contained"
            disabled={!acceptedTerms || signMutation.isPending}
            startIcon={signMutation.isPending ? <CircularProgress size={16} /> : <CheckCircleIcon />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {signMutation.isPending ? 'Signature…' : 'Signer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog
        open={declineDialogOpen}
        onClose={() => setDeclineDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Refuser le contrat</DialogTitle>
        <DialogContent>
          <TextField
            label="Raison du refus (optionnel)"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeclineDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => declineMutation.mutate()}
            variant="contained"
            color="error"
            disabled={declineMutation.isPending}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {declineMutation.isPending ? 'Refus…' : 'Confirmer le refus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}
