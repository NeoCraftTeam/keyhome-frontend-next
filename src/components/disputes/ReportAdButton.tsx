'use client';

import OpenDisputeDialog from '@/components/disputes/OpenDisputeDialog';
import type { Ad } from '@/types';
import Flag from '@mui/icons-material/Flag';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ReportAdButtonProps {
  ad: Ad;
  /** Variant forwarded to Button (default: 'outlined') */
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
}

export default function ReportAdButton({
  ad,
  variant = 'outlined',
  size = 'small',
}: ReportAdButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        variant={variant}
        size={size}
        color="inherit"
        startIcon={<Flag sx={{ fontSize: 16 }} />}
        onClick={() => setOpen(true)}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          color: 'text.secondary',
          borderColor: 'divider',
          '&:hover': { color: 'error.main', borderColor: 'error.light' },
        }}
      >
        Signaler un problème
      </Button>

      <OpenDisputeDialog
        open={open}
        onClose={() => setOpen(false)}
        initialContext={{ kind: 'ad', ad }}
        onCreated={(id) => {
          setOpen(false);
          router.push(`/litiges/${id}`);
        }}
      />
    </>
  );
}
