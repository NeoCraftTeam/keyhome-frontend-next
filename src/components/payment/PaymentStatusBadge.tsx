'use client';

import { Box, Chip } from '@mui/material';

type Status = 'pending' | 'success' | 'failed' | 'cancelled' | string;

interface PaymentStatusBadgeProps {
  status: Status;
  label?: string;
}

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: 'success' | 'error' | 'warning' | 'default' }
> = {
  success: { label: 'Payé', color: 'success' },
  failed: { label: 'Échoué', color: 'error' },
  cancelled: { label: 'Annulé', color: 'error' },
  pending: { label: 'En attente', color: 'warning' },
  refunded: { label: 'Remboursé', color: 'default' },
};

export default function PaymentStatusBadge({
  status,
  label,
}: PaymentStatusBadgeProps): React.ReactElement {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'default' as const,
  };

  return (
    <Box component="span">
      <Chip
        label={label ?? cfg.label}
        color={cfg.color}
        size="small"
        sx={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: 0.3 }}
      />
    </Box>
  );
}
