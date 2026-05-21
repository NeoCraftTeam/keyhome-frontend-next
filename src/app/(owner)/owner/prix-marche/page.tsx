'use client';

import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import RentEstimatorWidget from '@/components/ads/RentEstimatorWidget';
import PriceHeatmapLayer from '@/components/maps/PriceHeatmapLayer';
import FadeIn from '@/components/ui/FadeIn';
import Calculate from '@mui/icons-material/Calculate';
import Layers from '@mui/icons-material/Layers';
import { Box, Container, Grid, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';

export default function OwnerPrixMarchePage() {
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Prix du marché' },
          ]}
        />
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Prix du marché
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Analysez les tendances de prix par quartier et estimez le loyer de
          votre bien avant publication.
        </Typography>
      </FadeIn>

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab icon={<Layers />} iconPosition="start" label="Carte thermique" />
        <Tab
          icon={<Calculate />}
          iconPosition="start"
          label="Estimateur de loyer"
        />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Les zones rouges indiquent les quartiers les plus chers. Survolez un
            point pour voir le prix médian.
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
