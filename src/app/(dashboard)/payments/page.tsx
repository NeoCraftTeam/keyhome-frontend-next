'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentHistoryTableModern from '@/components/payment/PaymentHistoryTableModern';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { Box, CircularProgress, Container, Typography } from '@mui/material';

/**
 * Dual-purpose route:
 *  1. Normal visit        → displays the customer’s payment history.
 *  2. Legacy gateway callback (URL contains `transaction_id`, `tx_ref`, or `status`)
 *     → redirects to /payment-success so the verification flow continues to work.
 */
function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasPaymentParams =
    searchParams.has('transaction_id') ||
    searchParams.has('tx_ref') ||
    searchParams.has('status');

  useEffect(() => {
    if (hasPaymentParams) {
      router.replace(`/payment-success?${searchParams.toString()}`);
    }
  }, [hasPaymentParams, router, searchParams]);

  if (hasPaymentParams) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <PageBreadcrumbs
        items={[
          { label: 'Accueil', href: '/home' },
          { label: 'Mes Paiements' },
        ]}
      />
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Mes Paiements
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Historique de vos transactions.
      </Typography>
      <PaymentHistoryTableModern perPage={15} />
    </Container>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}
