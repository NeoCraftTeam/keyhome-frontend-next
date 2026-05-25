'use client';

import PageBreadcrumbs from '@/components/ui/layout/PageBreadcrumbs';
import {
  Group as GroupIcon,
  HourglassEmpty as SoonIcon,
} from '@mui/icons-material';
import { Box, Chip, Container, Paper, Typography } from '@mui/material';
import FadeIn from '@/components/ui/layout/FadeIn';

export default function OwnerEquipePage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Mon équipe' },
          ]}
        />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700}>
            Mon équipe
          </Typography>
          <Typography color="text.secondary">
            Gérez les membres de votre équipe et les invitations en attente.
          </Typography>
        </Box>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            p: { xs: 4, sm: 6 },
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GroupIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
          </Box>

          <Chip
            icon={<SoonIcon sx={{ fontSize: '1rem !important' }} />}
            label="Bientôt disponible"
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
          />

          <Typography variant="h6" fontWeight={700} color="text.secondary">
            Module en cours de développement
          </Typography>
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ maxWidth: 380 }}
          >
            La gestion d&apos;équipe sera disponible prochainement. Vous pourrez
            inviter des collaborateurs et gérer leurs accès depuis cette page.
          </Typography>
        </Paper>
      </FadeIn>
    </Container>
  );
}
