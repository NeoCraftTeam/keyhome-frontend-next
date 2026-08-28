'use client';

import PrivateOwnerNoteFields from '@/components/owner/PrivateOwnerNoteFields';
import type { PrivateOwnerNote } from '@/services/owner/owner-ads.service';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockOutlined from '@mui/icons-material/LockOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from '@mui/material';

interface Props {
  value: PrivateOwnerNote;
  onChange: (next: PrivateOwnerNote) => void;
  /** Start expanded when a delegated note is already on file (edit flow). */
  defaultExpanded?: boolean;
}

/**
 * Collapsible "Propriétaire du bien" section for the ad-creation wizard.
 * Collapsed by default; the advertiser opens it only when they are not the
 * real owner. The captured coordinates stay private (same endpoint as the
 * standalone dialog) — never exposed to visitors or admins.
 */
export default function PrivateOwnerNoteSection({
  value,
  onChange,
  defaultExpanded = false,
}: Props) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <LockOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Box>
            <Typography fontWeight={700}>Propriétaire du bien</Typography>
            <Typography variant="caption" color="text.secondary">
              Facultatif · privé. À remplir si vous n’êtes pas le propriétaire.
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <PrivateOwnerNoteFields
          value={value}
          onChange={onChange}
          showPrivacyHint
        />
      </AccordionDetails>
    </Accordion>
  );
}
