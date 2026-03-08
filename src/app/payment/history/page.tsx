'use client';

import PaymentHistoryTable from '@/components/payment/PaymentHistoryTable';
import { Box, Container, Typography, useTheme } from '@mui/material';

export default function PaymentHistoryPage(): React.ReactElement {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5, mb: 0.5 }}>
          Historique des paiements
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Retrouvez ici toutes vos transactions passées.
        </Typography>
      </Box>

      <PaymentHistoryTable />
    </Container>
  );
}
