'use client';

import { Box, Chip } from '@mui/material';

type Status = 'pending' | 'success' | 'failed' | 'cancelled' | string;

interface PaymentStatusBadgeProps {
  status: Status;
}

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: 'success' | 'error' | 'warning' | 'default' }
> = {
  success: { label: 'Payé', color: 'success' },
  failed: { label: 'Échoué', color: 'error' },
  cancelled: { label: 'Annulé', color: 'error' },
  pending: { label: 'En attente', color: 'warning' },
};

export default function PaymentStatusBadge({
  status,
}: PaymentStatusBadgeProps): React.ReactElement {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'default' as const,
  };

  return (
    <Box component="span">
      <Chip
        label={cfg.label}
        color={cfg.color}
        size="small"
        sx={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: 0.3 }}
      />
    </Box>
  );
}
