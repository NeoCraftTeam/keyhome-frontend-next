'use client';

import type { ScreeningStatus } from '@/services/owner/owner-screening.service';
import { Chip, type ChipProps } from '@mui/material';
import type { ReactElement } from 'react';

interface ScreeningStatusChipProps {
  status: ScreeningStatus;
  label: string;
}

const STATUS_COLOR: Record<ScreeningStatus, ChipProps['color']> = {
  pending: 'default',
  submitted: 'info',
  approved: 'success',
  rejected: 'error',
  expired: 'warning',
};

export default function ScreeningStatusChip({
  status,
  label,
}: ScreeningStatusChipProps): ReactElement {
  return (
    <Chip
      label={label}
      size="small"
      color={STATUS_COLOR[status]}
      variant={status === 'expired' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 600 }}
    />
  );
}
