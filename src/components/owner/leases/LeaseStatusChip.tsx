'use client';

import type { LeaseStatus } from '@/services/owner/owner-lease.service';
import { Chip, type ChipProps } from '@mui/material';
import type { ReactElement } from 'react';

interface LeaseStatusChipProps {
  status: LeaseStatus;
  label: string;
}

const STATUS_COLOR: Record<LeaseStatus, ChipProps['color']> = {
  draft: 'default',
  active: 'success',
  expired: 'warning',
  terminated: 'error',
  archived: 'default',
};

/**
 * Visual status indicator for a {@link LeaseContract}. Colour follows the
 * MUI semantic palette so the dark-mode tokens kick in automatically.
 */
export default function LeaseStatusChip({
  status,
  label,
}: LeaseStatusChipProps): ReactElement {
  return (
    <Chip
      label={label}
      size="small"
      color={STATUS_COLOR[status]}
      variant={status === 'archived' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 600 }}
    />
  );
}
