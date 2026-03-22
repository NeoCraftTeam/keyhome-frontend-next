'use client';

import {
  RocketLaunch as BoostIcon,
  Verified as VerifiedIcon,
  AutoAwesome as AiIcon,
  CameraAlt as PhotoIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Chip,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { brand } from '@/theme/tokens';

const SERVICES = [
  {
    title: 'Boost de visibilité',
    description: 'Remontez votre annonce en tête de liste et multipliez vos contacts par 3.',
    icon: <BoostIcon sx={{ fontSize: 40, color: brand.primary }} />,
    price: 'À partir de 1 500 FCFA',
    benefits: ['Position prioritaire', 'Badge exclusif', 'Statistiques détaillées'],
    cta: 'Booster une annonce',
    link: '/owner/ads',
  },
  {
    title: 'Vérification d\'identité',
    description: 'Gagnez la confiance des locataires avec le badge "Propriétaire Vérifié".',
    icon: <VerifiedIcon sx={{ fontSize: 40, color: '#10B981' }} />,
    price: '2 000 FCFA (Unique)',
    benefits: ['Confiance accrue', 'Moins de questions inutiles', 'Meilleur référencement'],
    cta: 'Se faire vérifier',
    link: '/owner/profile?action=verify',
  },
  {
    title: 'Rédaction IA Premium',
    description: 'Laissez notre IA rédiger une description irrésistible pour votre bien.',
    icon: <AiIcon sx={{ fontSize: 40, color: '#7C3AED' }} />,
    price: '500 FCFA / Annonce',
    benefits: ['Optimisé SEO', 'Style professionnel', 'Multi-langues'],
    cta: 'Améliorer mes annonces',
    link: '/owner/ads',
  },
  {
    title: 'Photographie Pro',
    description: 'Mise en relation avec un photographe partenaire pour des photos HD.',
    icon: <PhotoIcon sx={{ fontSize: 40, color: '#3B82F6' }} />,
    price: 'Sur devis',
    benefits: ['Qualité magazine', 'Plus de clics', 'Vente plus rapide'],
    cta: 'Prendre rendez-vous',
    link: '/owner/contact?subject=photo_pro',
  },
];

export default function ProServicesPage() {
  const router = useRouter();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Services Pro KeyHome
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Boostez vos performances et louez vos biens plus rapidement avec nos outils professionnels.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {SERVICES.map((service) => (
          <Grid size={{ xs: 12, md: 6 }} key={service.title}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  {service.icon}
                  <Chip
                    label={service.price}
                    sx={{ fontWeight: 700, bgcolor: 'action.hover' }}
                  />
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {service.title}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  {service.description}
                </Typography>
                <Box sx={{ mb: 4 }}>
                  {service.benefits.map((benefit) => (
                    <Box key={benefit} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
                      <Typography variant="body2" fontWeight={500}>
                        {benefit}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => router.push(service.link)}
                  sx={{
                    borderRadius: 3,
                    py: 1.5,
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: 'none',
                  }}
                >
                  {service.cta}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{
          mt: 8,
          p: 4,
          borderRadius: 4,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Besoin d'un accompagnement sur mesure ?
        </Typography>
        <Typography sx={{ mb: 3, opacity: 0.9 }}>
          Nos experts immobiliers sont là pour vous aider à optimiser votre patrimoine.
        </Typography>
        <Button
          variant="contained"
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            fontWeight: 700,
            borderRadius: 3,
            px: 4,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
          }}
          onClick={() => router.push('/owner/contact')}
        >
          Contacter un conseiller
        </Button>
      </Box>
    </Container>
  );
}
