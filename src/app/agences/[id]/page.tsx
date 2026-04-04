'use client';

import { agencyService, AgencyProfile } from '@/services/agency.service';
import { Ad } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Business from '@mui/icons-material/Business';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Group from '@mui/icons-material/Group';
import Home from '@mui/icons-material/Home';
import Verified from '@mui/icons-material/Verified';
import AdCard from '@/components/ads/AdCard';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AgencyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data, isLoading, isError } = useQuery({
    queryKey: ['agency-profile', id],
    queryFn: () => agencyService.getProfile(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const agency: AgencyProfile | undefined = data?.data;
  const ads: Ad[] = data?.ads || [];
  const meta = data?.meta;

  if (isLoading) {
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

  if (isError || !agency) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Business sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Agence introuvable
        </Typography>
        <Typography color="text.secondary">
          Cette agence n&apos;existe pas ou a été supprimée.
        </Typography>
      </Container>
    );
  }

  const memberSince = agency.created_at
    ? formatDistanceToNow(new Date(agency.created_at), {
        addSuffix: false,
        locale: fr,
      })
    : null;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <PageBreadcrumbs
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Agences', href: '/agences' },
          { label: agency.name },
        ]}
      />

      {/* Agency Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' },
          gap: 3,
        }}
      >
        <Avatar
          src={agency.logo || undefined}
          alt={agency.name}
          sx={{
            width: { xs: 80, md: 100 },
            height: { xs: 80, md: 100 },
            bgcolor: 'primary.main',
            fontSize: { xs: 32, md: 40 },
            fontWeight: 700,
          }}
        >
          {agency.name.charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              justifyContent: { xs: 'center', sm: 'flex-start' },
              mb: 0.5,
            }}
          >
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
            >
              {agency.name}
            </Typography>
            <Verified sx={{ color: 'primary.main', fontSize: 24 }} />
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-start' },
              mt: 1,
            }}
          >
            {memberSince && (
              <Chip
                icon={<CalendarMonth sx={{ fontSize: 16 }} />}
                label={`Membre depuis ${memberSince}`}
                size="small"
                variant="outlined"
                sx={{ borderRadius: '20px' }}
              />
            )}
            {agency.users_count !== undefined && agency.users_count > 0 && (
              <Chip
                icon={<Group sx={{ fontSize: 16 }} />}
                label={`${agency.users_count} agent${agency.users_count > 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
                sx={{ borderRadius: '20px' }}
              />
            )}
            {meta?.total !== undefined && (
              <Chip
                icon={<Home sx={{ fontSize: 16 }} />}
                label={`${meta.total} annonce${meta.total > 1 ? 's' : ''} active${meta.total > 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
                sx={{ borderRadius: '20px' }}
              />
            )}
          </Box>

          {agency.owner && (
            <Box
              component="a"
              href={`/bailleurs/${agency.owner.id}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mt: 2,
                justifyContent: { xs: 'center', sm: 'flex-start' },
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
                borderRadius: 2,
                p: 0.5,
                mx: -0.5,
                transition: 'background-color 0.15s',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Avatar
                src={agency.owner.avatar || undefined}
                sx={{ width: 32, height: 32 }}
              >
                {agency.owner.firstname?.charAt(0)}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                Géré par{' '}
                <strong>
                  {agency.owner.firstname} {agency.owner.lastname}
                </strong>{' '}
                · Voir le profil
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Listings */}
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Annonces de {agency.name}
      </Typography>

      {ads.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Home sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Aucune annonce disponible
          </Typography>
          <Typography color="text.secondary">
            Cette agence n&apos;a pas encore publié d&apos;annonces.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={isMobile ? 1 : 2}>
          {ads.map((ad) => (
            <Grid key={ad.id} size={{ xs: 6, sm: 6, md: 4, lg: 3 }}>
              <AdCard ad={ad} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
