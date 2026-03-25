'use client';

import ComparisonTable from '@/components/ads/ComparisonTable';
import FadeIn from '@/components/ui/FadeIn';
import { useComparator } from '@/providers/ComparatorProvider';
import { ChevronLeft as ChevronLeftIcon, CompareArrows, MapsHomeWork } from '@mui/icons-material';
import { Box, Button, Container, IconButton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function ComparaisonsPage() {
  const { items, remove, clear } = useComparator();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <FadeIn delay={0.1} direction="up">
          <CompareArrows sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Votre comparateur est vide
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Ajoutez des annonces depuis les cartes ou les pages détail pour les comparer côte à côte.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<MapsHomeWork />}
            onClick={() => router.push('/search')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Voir les annonces
          </Button>
        </FadeIn>
      </Container>
    );
  }

  if (items.length === 1) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <FadeIn delay={0.1} direction="up">
          <CompareArrows sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Ajoutez au moins un autre bien
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Vous avez 1 annonce dans votre comparateur. Ajoutez-en une autre pour les comparer.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<MapsHomeWork />}
            onClick={() => router.push('/search')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Rechercher des annonces
          </Button>
        </FadeIn>
      </Container>
    );
  }

  return (
    <Box sx={{ pb: { xs: 12, sm: 6 } }}>
      <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
        <FadeIn delay={0.05} direction="up">
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton onClick={() => router.back()} size="small" aria-label="Retour" sx={{ border: '1px solid', borderColor: 'divider' }}>
                <ChevronLeftIcon />
              </IconButton>
              <CompareArrows color="primary" sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Comparaison de biens
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {items.length} annonce{items.length > 1 ? 's' : ''} sélectionnée{items.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={clear}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Tout effacer
            </Button>
          </Box>

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <ComparisonTable items={items} onRemove={remove} showActions />
          </Box>
        </FadeIn>
      </Container>
    </Box>
  );
}
