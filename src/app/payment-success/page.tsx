'use client';

import UnlockPaymentReturnView from '@/components/payment/return/UnlockPaymentReturnView';
import { Box, CircularProgress } from '@mui/material';
import { Suspense } from 'react';
import type { ReactElement } from 'react';

export default function PaymentSuccessPage(): ReactElement {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <UnlockPaymentReturnView />
    </Suspense>
  );
}
