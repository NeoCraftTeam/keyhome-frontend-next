'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import type { PrivateOwnerNote } from '@/services/owner/owner-ads.service';
import LockOutlined from '@mui/icons-material/LockOutlined';
import {
  Box,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

/** Blank note — owner is, by default, the real property owner (nothing to capture). */
export const EMPTY_PRIVATE_OWNER_NOTE: PrivateOwnerNote = {
  is_property_owner: true,
  owner_name: '',
  owner_address: '',
  owner_phone: '',
  owner_email: '',
  notes: '',
};

interface Props {
  value: PrivateOwnerNote;
  onChange: (next: PrivateOwnerNote) => void;
  /** Render the "visible only by you" privacy line above the switch. */
  showPrivacyHint?: boolean;
}

/**
 * Controlled field group for the private "advertiser ≠ owner" note. The real
 * owner's coordinates only appear once the advertiser declares they are not the
 * property owner. Shared by the standalone dialog and the ad-creation wizard.
 */
export default function PrivateOwnerNoteFields({
  value,
  onChange,
  showPrivacyHint = false,
}: Props) {
  const update = (
    field: keyof PrivateOwnerNote,
    fieldValue: string | boolean
  ): void => onChange({ ...value, [field]: fieldValue });

  const delegated = !value.is_property_owner;

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {showPrivacyHint && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <LockOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography variant="body2" color="text.secondary">
            Visible uniquement par vous. Ni les visiteurs ni les administrateurs
            n’y ont accès.
          </Typography>
        </Box>
      )}
      <FormControlLabel
        control={
          <Switch
            checked={value.is_property_owner}
            onChange={(_, checked) => update('is_property_owner', checked)}
          />
        }
        label="Je suis le propriétaire réel de ce bien"
      />
      {delegated && (
        <>
          <AppAlert
            severity="info"
            message="Conservez ici les coordonnées du propriétaire réel afin de les retrouver lorsqu’un prospect vous contacte."
          />
          <TextField
            required
            label="Nom du propriétaire réel"
            value={value.owner_name ?? ''}
            onChange={(e) => update('owner_name', e.target.value)}
            inputProps={{ maxLength: 150 }}
          />
          <TextField
            label="Adresse"
            value={value.owner_address ?? ''}
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
              value={value.owner_phone ?? ''}
              onChange={(e) => update('owner_phone', e.target.value)}
              inputProps={{ maxLength: 40 }}
            />
            <TextField
              type="email"
              label="Adresse e-mail"
              value={value.owner_email ?? ''}
              onChange={(e) => update('owner_email', e.target.value)}
              inputProps={{ maxLength: 254 }}
            />
          </Box>
          <TextField
            multiline
            minRows={3}
            label="Notes personnelles"
            placeholder="Mandat, disponibilité, consignes de contact…"
            value={value.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
            inputProps={{ maxLength: 3000 }}
          />
        </>
      )}
    </Box>
  );
}
