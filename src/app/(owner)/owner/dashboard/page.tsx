'use client';

import DashboardHeroStatCard from '@/components/owner/dashboard/DashboardHeroStatCard';
import OwnerTopAdsTable from '@/components/owner/dashboard/OwnerTopAdsTable';
import OwnerViewsFavoritesAreaChart from '@/components/owner/dashboard/OwnerViewsFavoritesAreaChart';
import {
  extractMetricSeries,
  mergeViewsAndFavoritesSeries,
  periodParamToDays,
} from '@/lib/owner-dashboard-analytics';
import { useAuth } from '@/providers/AuthProvider';
import { ownerService, type OwnerAnalyticsOverview, type OwnerViewingReservation } from '@/services/owner.service';
import FadeIn from '@/components/ui/FadeIn';
import AppTour from '@/components/ui/AppTour';
import { useGreeting } from '@/hooks/useGreeting';
import {
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  Favorite as FavoriteIcon,
  BarChart as EngagementIcon,
  Home as HomeIcon,
  RocketLaunch as BoostIcon,
  Visibility as VisibilityIcon,
  ArrowForward as ArrowIcon,
  AccessTime as ClockIcon,
  Add as AddIcon,
  WavingHand as WavingHandIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Ad } from '@/types';

const TEAL = '#14b8a6';
const BLUE = '#3b82f6';
const ROSE = '#ef4444';
type AnalyticsPeriod = '7d' | '30d' | '90d';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return s;
  }
}

function formatTime(s: string) {
  try {
    return new Date(s).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return s;
  }
}

function getStatusColor(status: string): 'warning' | 'success' | 'error' | 'info' | 'default' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'success';
    case 'cancelled':
    case 'declined':
      return 'error';
    case 'completed':
      return 'info';
    default:
      return 'default';
  }
}

function periodLabelFr(p: AnalyticsPeriod): string {
  if (p === '7d') {
    return '7 derniers jours';
  }
  if (p === '90d') {
    return '90 derniers jours';
  }
  return '30 derniers jours';
}

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const greeting = useGreeting();
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['owner-analytics', period],
    queryFn: () => ownerService.getAnalytics(period),
  });

  const { data: adsCountData, isLoading: adsCountLoading } = useQuery({
    queryKey: ['owner-ads-total'],
    queryFn: () => ownerService.getMyAds({ page: 1, per_page: 1 }),
  });

  const { data: adsData, isLoading: adsLoading } = useQuery({
    queryKey: ['owner-ads-recent'],
    queryFn: () => ownerService.getMyAds({ page: 1, per_page: 5, sort: 'created_at', order: 'desc' }),
  });

  const { data: viewingsData, isLoading: viewingsLoading } = useQuery({
    queryKey: ['owner-viewings-recent'],
    queryFn: () => ownerService.getViewingReservations({ page: 1, status: 'pending' }),
  });

  const analytics = analyticsData as OwnerAnalyticsOverview | undefined;
  const recentAds = ((adsData as { data?: Ad[] })?.data ?? []) as Ad[];
  const pendingViewings = ((viewingsData as { data?: OwnerViewingReservation[] })?.data ?? []) as OwnerViewingReservation[];
  const totalAds = (adsCountData as { meta?: { total?: number } })?.meta?.total ?? 0;

  const chartDays = periodParamToDays(period);
  const chartSeries = useMemo(
    () => mergeViewsAndFavoritesSeries(analytics?.trends, chartDays),
    [analytics?.trends, chartDays],
  );

  const impressionsSpark = useMemo(
    () => extractMetricSeries(analytics?.trends, 'impression', chartDays),
    [analytics?.trends, chartDays],
  );
  const viewsSpark = useMemo(
    () => extractMetricSeries(analytics?.trends, 'view', chartDays),
    [analytics?.trends, chartDays],
  );
  const favoritesSpark = useMemo(
    () => extractMetricSeries(analytics?.trends, 'favorite', chartDays),
    [analytics?.trends, chartDays],
  );
  const engagementSpark = useMemo(
    () => chartSeries.map((d) => d.views + d.favorites),
    [chartSeries],
  );

  const engagementRate = analytics?.totals?.engagement_rate ?? 0;
  const engagementSubtitle =
    engagementRate < 1 ? 'Engagement faible' : engagementRate < 4 ? 'Engagement modéré' : 'Bon engagement';

  return (
    <>
      <AppTour variant="owner" />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2.5,
        }}
      >
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, width: { xs: '100%', sm: 'auto' } }}>
          <FadeIn delay={0.05} direction="up">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                gap: 1,
                mb: 1,
              }}
            >
              <WavingHandIcon sx={{ fontSize: { xs: 22, sm: 24 }, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                {greeting},{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  {user?.firstname || 'Propriétaire'}
                </Box>{' '}
                !
              </Typography>
            </Box>
          </FadeIn>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.35rem', sm: '2rem' } }}>
            Tableau de bord
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Suivez vos annonces et vos performances en un coup d’œil.
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={period}
            onChange={(_, v) => v && setPeriod(v)}
            sx={{
              display: 'inline-flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 1,
              p: 0.5,
              bgcolor: 'action.hover',
              borderRadius: 3,
              border: 'none',
              '& .MuiToggleButtonGroup-grouped': {
                margin: '0 !important',
                border: 'none !important',
                borderRadius: '12px !important',
              },
              '& .MuiToggleButton-root': {
                px: { xs: 2, sm: 2.75 },
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                border: '1px solid transparent',
                '&.Mui-selected': {
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  color: 'text.primary',
                },
              },
            }}
          >
            <ToggleButton value="7d">7 jours</ToggleButton>
            <ToggleButton value="30d">30 jours</ToggleButton>
            <ToggleButton value="90d">90 jours</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* ═══ Hero stats (Filament-style) ═══ */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DashboardHeroStatCard
            title="Mes biens"
            value={adsCountLoading ? '—' : totalAds.toLocaleString('fr-FR')}
            subtitle="Annonces publiées"
            icon={<HomeIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />}
            accentColor={TEAL}
            sparklineData={impressionsSpark.length ? impressionsSpark : Array(chartDays).fill(0)}
            loading={adsCountLoading || analyticsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DashboardHeroStatCard
            title="Vues"
            value={analytics?.totals?.views != null ? analytics.totals.views.toLocaleString('fr-FR') : '0'}
            subtitle={periodLabelFr(period)}
            icon={<VisibilityIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />}
            accentColor={TEAL}
            sparklineData={viewsSpark.length ? viewsSpark : Array(chartDays).fill(0)}
            loading={analyticsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DashboardHeroStatCard
            title="Favoris"
            value={analytics?.totals?.favorites != null ? analytics.totals.favorites.toLocaleString('fr-FR') : '0'}
            subtitle={periodLabelFr(period)}
            icon={<FavoriteIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />}
            accentColor={ROSE}
            sparklineData={favoritesSpark.length ? favoritesSpark : Array(chartDays).fill(0)}
            loading={analyticsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <DashboardHeroStatCard
            title="Engagement"
            value={`${engagementRate.toFixed(1)}%`}
            subtitle={engagementSubtitle}
            icon={<EngagementIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />}
            accentColor={BLUE}
            sparklineData={engagementSpark.length ? engagementSpark : Array(chartDays).fill(0)}
            loading={analyticsLoading}
          />
        </Grid>
      </Grid>

      {/* ═══ Area chart ═══ */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            Vues sur mes annonces
          </Typography>
          {analyticsLoading ? (
            <Skeleton
              variant="rectangular"
              sx={{ borderRadius: 2, width: '100%', height: { xs: 220, sm: 280, md: 320 } }}
            />
          ) : (
            <OwnerViewsFavoritesAreaChart data={chartSeries} />
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Visites en attente
                  </Typography>
                  {pendingViewings.length > 0 && (
                    <Chip
                      label={pendingViewings.length}
                      size="small"
                      color="warning"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                    />
                  )}
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowIcon />}
                  onClick={() => router.push('/owner/viewings')}
                  sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Tout voir
                </Button>
              </Box>

              {viewingsLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                  ))}
                </Box>
              ) : pendingViewings.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ClockIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Aucune visite en attente de confirmation.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {pendingViewings.slice(0, 4).map((v, vIdx) => (
                    <Box
                      key={v.id != null ? String(v.id) : `pending-viewing-${vIdx}`}
                      onClick={() => router.push('/owner/viewings')}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        '&:hover': { bgcolor: 'action.selected' },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: 'warning.main',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {v.client?.firstname?.[0] || '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {v.client?.firstname} {v.client?.lastname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {v.ad?.title} &middot; {formatDate(v.slot_date)} {formatTime(v.slot_starts_at)}
                        </Typography>
                      </Box>
                      <Chip
                        label={v.status_label || v.status}
                        size="small"
                        color={getStatusColor(v.status)}
                        sx={{ fontSize: '0.65rem', height: 22 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HomeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Annonces récentes
                  </Typography>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowIcon />}
                  onClick={() => router.push('/owner/ads')}
                  sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Tout voir
                </Button>
              </Box>

              {adsLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                  ))}
                </Box>
              ) : recentAds.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <HomeIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Aucune annonce pour le moment.
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/owner/ads/new')}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Créer une annonce
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {recentAds.slice(0, 4).map((ad, adIdx) => {
                    const img = ad.images?.[0];
                    const imgUrl = img?.thumb || img?.url;
                    return (
                      <Box
                        key={ad.id != null ? String(ad.id) : `recent-ad-${adIdx}`}
                        onClick={() => router.push(`/owner/ads/${ad.id}`)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          '&:hover': { bgcolor: 'action.selected' },
                        }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 36,
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: 'grey.200',
                            flexShrink: 0,
                          }}
                        >
                          {imgUrl ? (
                            <Box
                              component="img"
                              src={imgUrl}
                              alt={ad.title}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <HomeIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {ad.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {ad.adresse || ad.quarter?.name || ''}
                          </Typography>
                        </Box>
                        <Chip
                          label={ad.status_label || ad.status}
                          size="small"
                          color={
                            ad.status === 'available'
                              ? 'success'
                              : ad.status === 'pending' || ad.status === 'reserved'
                                ? 'warning'
                                : 'default'
                          }
                          sx={{ fontSize: '0.65rem', height: 22 }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {analytics?.top_ads && analytics.top_ads.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <OwnerTopAdsTable
            rows={analytics.top_ads}
            periodLabel={periodLabelFr(period)}
            onRowClick={(adId) => router.push(`/owner/ads/${adId}`)}
          />
        </Box>
      )}

      {analytics?.totals?.conversion_rate != null && analytics.totals.conversion_rate < 5 && (
        <Card
          elevation={0}
          sx={{
            mt: 3,
            borderRadius: 4,
            overflow: 'hidden',
            background: (th) =>
              th.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(246,71,95,0.15), rgba(124,58,237,0.1))'
                : 'linear-gradient(135deg, rgba(246,71,95,0.06), rgba(124,58,237,0.04))',
            border: '1px solid',
            borderColor: 'rgba(246, 71, 95, 0.2)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <BoostIcon sx={{ color: '#F6475F' }} />
                  <Typography variant="h6" fontWeight={800} color="#F6475F">
                    Boostez vos performances
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Votre taux de conversion est de <strong>{analytics.totals.conversion_rate.toFixed(1)}%</strong>.
                  Les annonces boostées obtiennent en moyenne <strong>3x plus de contacts</strong> qualifiés.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {['Position prioritaire', 'Badge "Top Annonce"', 'Remontée quotidienne'].map((b) => (
                    <Box key={b} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="caption" fontWeight={600}>
                        {b}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button
                  variant="contained"
                  onClick={() => router.push('/owner/pro-services')}
                  sx={{
                    bgcolor: '#F6475F',
                    color: 'white',
                    fontWeight: 700,
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#D93A50' },
                    boxShadow: '0 8px 16px rgba(246, 71, 95, 0.2)',
                  }}
                >
                  Découvrir les Boosts
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Container>
    </>
  );
}
