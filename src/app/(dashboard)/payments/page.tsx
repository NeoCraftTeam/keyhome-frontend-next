'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

/**
 * Legacy FedaPay callback route — kept for backward compatibility.
 * Immediately forwards to /payment-success which handles all retry logic.
 */
function PaymentRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    router.replace(`/payment-success?${searchParams.toString()}`);
  }, [router, searchParams]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
      <PaymentRedirect />
    </Suspense>
  );
}
