'use client';

import PaymentHistoryTable from '@/components/payment/PaymentHistoryTable';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { Container, Typography } from '@mui/material';
import FadeIn from '@/components/ui/FadeIn';

export default function OwnerPaymentsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Mes Paiements' },
          ]}
        />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Mes Paiements
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Historique de vos transactions.
        </Typography>
      </FadeIn>
      <FadeIn delay={0.1}>
        <PaymentHistoryTable />
      </FadeIn>
    </Container>
  );
}
