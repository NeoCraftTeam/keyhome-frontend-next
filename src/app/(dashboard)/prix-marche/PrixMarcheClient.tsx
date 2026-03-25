'use client';

import PriceHeatmapLayer from '@/components/maps/PriceHeatmapLayer';
import RentEstimatorWidget from '@/components/ads/RentEstimatorWidget';
import { BarChart, Calculate, ChevronLeft as ChevronLeftIcon, Layers } from '@mui/icons-material';
import { Box, Container, Grid, IconButton, Tab, Tabs, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PrixMarcheClient() {
  const [tab, setTab] = useState(0);
  const router = useRouter();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Box sx={{ mb: 2 }}>
        <IconButton onClick={() => router.back()} size="small" aria-label="Retour" sx={{ border: '1px solid', borderColor: 'divider' }}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Prix du marché
      </Typography>
      <Typography color="text.secondary" mb={4}>
        Analysez les tendances de prix par quartier et estimez le loyer de votre bien.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab icon={<Layers />} iconPosition="start" label="Carte thermique" />
        <Tab icon={<Calculate />} iconPosition="start" label="Estimateur de loyer" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Les zones rouges indiquent les quartiers les plus chers. Survolez un point pour voir le prix médian.
          </Typography>
          <PriceHeatmapLayer height={550} />
        </Box>
      )}

      {tab === 1 && (
        <Grid container justifyContent="center">
          <Grid size={{ xs: 12, sm: 8, md: 6 }}>
            <RentEstimatorWidget />
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
