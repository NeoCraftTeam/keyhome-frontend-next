'use client';

import CreditPurchaseReturnView from '@/components/payment/return/CreditPurchaseReturnView';
import { Box, CircularProgress } from '@mui/material';
import { Suspense } from 'react';
import type { ReactElement } from 'react';

export default function CreditCallbackPage(): ReactElement {
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
      <CreditPurchaseReturnView />
    </Suspense>
  );
}
