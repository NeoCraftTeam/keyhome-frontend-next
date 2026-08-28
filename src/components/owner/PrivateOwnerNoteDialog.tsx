'use client';

import PrivateOwnerNoteFields, {
  EMPTY_PRIVATE_OWNER_NOTE,
} from '@/components/owner/PrivateOwnerNoteFields';
import AppAlert from '@/components/ui/feedback/AppAlert';
import { getSafeErrorMessage } from '@/lib/error-messages';
import {
  ownerAdsService,
  type PrivateOwnerNote,
} from '@/services/owner/owner-ads.service';
import LockOutlined from '@mui/icons-material/LockOutlined';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

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
  const [form, setForm] = useState<PrivateOwnerNote>(EMPTY_PRIVATE_OWNER_NOTE);
  const [feedback, setFeedback] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['private-owner-note', adId],
    queryFn: () => ownerAdsService.getPrivateOwnerNote(adId!),
    enabled: !!adId,
  });

  useEffect(() => {
    if (query.data !== undefined) {
      setForm(query.data ?? EMPTY_PRIVATE_OWNER_NOTE);
    }
  }, [query.data]);

  const save = useMutation({
    mutationFn: () => ownerAdsService.savePrivateOwnerNote(adId!, form),
    onSuccess: (data) => {
      queryClient.setQueryData(['private-owner-note', adId], data);
      setFeedback('Note privée enregistrée.');
    },
  });

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
            <PrivateOwnerNoteFields value={form} onChange={setForm} />
            {feedback && <AppAlert severity="success" message={feedback} />}
            {save.isError && (
              <AppAlert
                severity="error"
                message={getSafeErrorMessage(
                  save.error,
                  'Impossible d’enregistrer la note.'
                )}
              />
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
