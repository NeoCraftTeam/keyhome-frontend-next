'use client';

import PaymentHistoryTable from '@/components/payment/PaymentHistoryTable';
import { Container, Typography } from '@mui/material';

export default function OwnerPaymentsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Mes Paiements
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Historique de vos transactions.
      </Typography>
      <PaymentHistoryTable perPage={15} />
    </Container>
  );
}
