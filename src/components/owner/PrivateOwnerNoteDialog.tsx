'use client';

import { getSafeErrorMessage } from '@/lib/error-messages';
import {
  ownerAdsService,
  type PrivateOwnerNote,
} from '@/services/owner/owner-ads.service';
import LockOutlined from '@mui/icons-material/LockOutlined';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const EMPTY: PrivateOwnerNote = {
  is_property_owner: true,
  owner_name: '',
  owner_address: '',
  owner_phone: '',
  owner_email: '',
  notes: '',
};

interface Props {
  adId: string | null;
  adTitle?: string;
  onClose: () => void;
}

export default function PrivateOwnerNoteDialog({
  adId,
  adTitle,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PrivateOwnerNote>(EMPTY);
  const [feedback, setFeedback] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['private-owner-note', adId],
    queryFn: () => ownerAdsService.getPrivateOwnerNote(adId!),
    enabled: !!adId,
  });

  useEffect(() => {
    if (query.data !== undefined) setForm(query.data ?? EMPTY);
  }, [query.data]);

  const save = useMutation({
    mutationFn: () => ownerAdsService.savePrivateOwnerNote(adId!, form),
    onSuccess: (data) => {
      queryClient.setQueryData(['private-owner-note', adId], data);
      setFeedback('Note privée enregistrée.');
    },
  });

  const update = (field: keyof PrivateOwnerNote, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }));

  const delegated = !form.is_property_owner;

  return (
    <Dialog open={!!adId} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Note privée du bien</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <LockOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography variant="body2" color="text.secondary">
            Visible uniquement par vous. Ni les visiteurs ni les administrateurs
            n’y ont accès.
          </Typography>
        </Box>
        {adTitle && (
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            {adTitle}
          </Typography>
        )}
        {query.isLoading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_property_owner}
                  onChange={(_, value) => update('is_property_owner', value)}
                />
              }
              label="Je suis le propriétaire réel de ce bien"
            />
            {delegated && (
              <>
                <Alert severity="info">
                  Conservez ici les coordonnées du propriétaire réel afin de les
                  retrouver lorsqu’un prospect vous contacte.
                </Alert>
                <TextField
                  required
                  label="Nom du propriétaire réel"
                  value={form.owner_name ?? ''}
                  onChange={(e) => update('owner_name', e.target.value)}
                  inputProps={{ maxLength: 150 }}
                />
                <TextField
                  label="Adresse"
                  value={form.owner_address ?? ''}
                  onChange={(e) => update('owner_address', e.target.value)}
                  inputProps={{ maxLength: 500 }}
                />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Téléphone"
                    value={form.owner_phone ?? ''}
                    onChange={(e) => update('owner_phone', e.target.value)}
                    inputProps={{ maxLength: 40 }}
                  />
                  <TextField
                    type="email"
                    label="Adresse e-mail"
                    value={form.owner_email ?? ''}
                    onChange={(e) => update('owner_email', e.target.value)}
                    inputProps={{ maxLength: 254 }}
                  />
                </Box>
                <TextField
                  multiline
                  minRows={3}
                  label="Notes personnelles"
                  placeholder="Mandat, disponibilité, consignes de contact…"
                  value={form.notes ?? ''}
                  onChange={(e) => update('notes', e.target.value)}
                  inputProps={{ maxLength: 3000 }}
                />
              </>
            )}
            {feedback && <Alert severity="success">{feedback}</Alert>}
            {save.isError && (
              <Alert severity="error">
                {getSafeErrorMessage(
                  save.error,
                  'Impossible d’enregistrer la note.'
                )}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Fermer</Button>
        <Button
          variant="contained"
          onClick={() => save.mutate()}
          disabled={
            query.isLoading ||
            save.isPending ||
            (delegated && !form.owner_name?.trim())
          }
        >
          {save.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
