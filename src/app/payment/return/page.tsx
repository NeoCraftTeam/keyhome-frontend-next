'use client';

import CreditPurchaseReturnView from '@/components/payment/return/CreditPurchaseReturnView';
import OwnerFlowPaymentReturnView from '@/components/payment/return/OwnerFlowPaymentReturnView';
import UnlockPaymentReturnView from '@/components/payment/return/UnlockPaymentReturnView';
import { parsePaymentReturnParams } from '@/lib/payment-gateway-return';
import { brand } from '@/theme/tokens';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import type { ReactElement } from 'react';

const VALID_FLOWS = new Set(['credit', 'unlock', 'subscription', 'boost']);

function PaymentReturnRouter(): ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();

  const flowRaw = searchParams.get('flow');
  const returnParams = parsePaymentReturnParams(searchParams);
  const flow =
    flowRaw && VALID_FLOWS.has(flowRaw)
      ? flowRaw
      : returnParams.txRef || returnParams.gatewayReference
        ? 'credit'
        : null;

  useEffect(() => {
    if (flow === null) {
      router.replace('/home');
    }
  }, [flow, router]);

  if (flow === null) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: brand.primary }} />
        <Typography variant="body2" color="text.secondary">
          Redirection…
        </Typography>
      </Box>
    );
  }

  if (flow === 'credit') {
    return <CreditPurchaseReturnView />;
  }

  if (flow === 'unlock') {
    return <UnlockPaymentReturnView />;
  }

  if (flow === 'subscription') {
    return <OwnerFlowPaymentReturnView flow="subscription" />;
  }

  return <OwnerFlowPaymentReturnView flow="boost" />;
}

export default function PaymentReturnPage(): ReactElement {
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
      <PaymentReturnRouter />
    </Suspense>
  );
}
