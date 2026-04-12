'use client';

import DashboardHeroStatCard from '@/components/owner/dashboard/DashboardHeroStatCard';
import OwnerTopAdsTable from '@/components/owner/dashboard/OwnerTopAdsTable';
import OwnerViewsFavoritesAreaChart from '@/components/owner/dashboard/OwnerViewsFavoritesAreaChart';
import ProfileCompletionCard from '@/components/owner/dashboard/ProfileCompletionCard';
import {
  extractMetricSeries,
  mergeViewsAndFavoritesSeries,
  periodParamToDays,
} from '@/lib/owner-dashboard-analytics';
import { useAuth } from '@/providers/AuthProvider';
import {
  ownerService,
  type OwnerAnalyticsOverview,
  type OwnerViewingReservation,
} from '@/services/owner.service';
import FadeIn from '@/components/ui/FadeIn';
import StaggerList from '@/components/ui/StaggerList';
import EmptyState from '@/components/ui/EmptyState';
import { ShimmerBox } from '@/components/ui/ShimmerCard';
import GradientText from '@/components/ui/GradientText';
import AppTour from '@/components/ui/AppTour';
import { useGreeting } from '@/hooks/useGreeting';
import {
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  Download as DownloadIcon,
  Favorite as FavoriteIcon,
  BarChart as EngagementIcon,
  Home as HomeIcon,
  RocketLaunch as BoostIcon,
  Visibility as VisibilityIcon,
  ArrowForward as ArrowIcon,
  AccessTime as ClockIcon,
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
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Ad } from '@/types';
import { brandAgent } from '@/theme/tokens';

/** Vibrant accent colors for dashboard cards */
const TEAL = brandAgent.primary; // #0D9488 — primary teal
const SKY = brandAgent.secondary; // #0EA5E9 — sky blue (complements gradient)
const ROSE = '#ec4899';
type AnalyticsPeriod = '7d' | '30d' | '90d';
const PREV_PERIOD: Record<AnalyticsPeriod, AnalyticsPeriod> = {
  '7d': '30d',
  '30d': '90d',
  '90d': '90d',
};

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return ((current - previous) / previous) * 100;
}

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

function getStatusColor(
  status: string
): 'warning' | 'success' | 'error' | 'info' | 'default' {
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
  const [tab, setTab] = useState(0);

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['owner-analytics', period],
    queryFn: () => ownerService.getAnalytics(period),
  });

  const { data: prevAnalyticsData } = useQuery({
    queryKey: ['owner-analytics', PREV_PERIOD[period]],
    queryFn: () => ownerService.getAnalytics(PREV_PERIOD[period]),
    enabled: PREV_PERIOD[period] !== period && !analyticsLoading,
    staleTime: 5 * 60 * 1000,
  });

  const { data: adsCountData, isLoading: adsCountLoading } = useQuery({
    queryKey: ['owner-ads-total'],
    queryFn: () => ownerService.getMyAds({ page: 1, per_page: 1 }),
  });

  const { data: adsData, isLoading: adsLoading } = useQuery({
    queryKey: ['owner-ads-recent'],
    queryFn: () =>
      ownerService.getMyAds({
        page: 1,
        per_page: 5,
        sort: 'created_at',
        order: 'desc',
      }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: viewingsData, isLoading: viewingsLoading } = useQuery({
    queryKey: ['owner-viewings-recent'],
    queryFn: () =>
      ownerService.getViewingReservations({ page: 1, status: 'pending' }),
    staleTime: 2 * 60 * 1000,
  });

  const analytics = analyticsData as OwnerAnalyticsOverview | undefined;
  const recentAds = ((adsData as { data?: Ad[] })?.data ?? []) as Ad[];
  const pendingViewings = ((
    viewingsData as { data?: OwnerViewingReservation[] }
  )?.data ?? []) as OwnerViewingReservation[];
  const totalAds =
    (adsCountData as { meta?: { total?: number } })?.meta?.total ?? 0;

  const chartDays = periodParamToDays(period);
  const chartSeries = useMemo(
    () => mergeViewsAndFavoritesSeries(analytics?.trends, chartDays),
    [analytics?.trends, chartDays]
  );

  const impressionsSpark = useMemo(
    () => extractMetricSeries(analytics?.trends, 'impression', chartDays),
    [analytics?.trends, chartDays]
  );
  const viewsSpark = useMemo(
    () => extractMetricSeries(analytics?.trends, 'view', chartDays),
    [analytics?.trends, chartDays]
  );
  const favoritesSpark = useMemo(
    () => extractMetricSeries(analytics?.trends, 'favorite', chartDays),
    [analytics?.trends, chartDays]
  );
  const engagementSpark = useMemo(
    () => chartSeries.map((d) => d.views + d.favorites),
    [chartSeries]
  );

  const engagementRate = analytics?.totals?.engagement_rate ?? 0;
  const engagementSubtitle =
    engagementRate < 1
      ? 'Engagement faible'
      : engagementRate < 4
        ? 'Engagement modéré'
        : 'Bon engagement';

  const prevAnalytics = prevAnalyticsData as OwnerAnalyticsOverview | undefined;
  const viewsChange = prevAnalytics
    ? pctChange(analytics?.totals?.views ?? 0, prevAnalytics.totals.views)
    : null;
  const favoritesChange = prevAnalytics
    ? pctChange(
        analytics?.totals?.favorites ?? 0,
        prevAnalytics.totals.favorites
      )
    : null;
  const engagementChange = prevAnalytics
    ? pctChange(engagementRate, prevAnalytics.totals.engagement_rate)
    : null;

  const handleExportCSV = useCallback(() => {
    if (!analytics?.top_ads?.length) {
      return;
    }
    const header = 'Annonce,Vues,Favoris,Déverrouillages,Taux de conversion\n';
    const rows = analytics.top_ads
      .map(
        (a) =>
          `"${a.title.replace(/"/g, '""')}",${a.views},${a.favorites},${a.unlocks},${(a.conversion_rate ?? 0).toFixed(1)}%`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [analytics, period]);

  return (
    <>
      <AppTour variant="owner" />
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
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
          <Box
            sx={{
              textAlign: { xs: 'center', sm: 'left' },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
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
                <WavingHandIcon
                  sx={{ fontSize: { xs: 22, sm: 24 }, color: 'primary.main' }}
                />
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' } }}
                >
                  {greeting},{' '}
                  <Box component="span" sx={{ color: 'primary.main' }}>
                    {user?.firstname || 'Propriétaire'}
                  </Box>{' '}
                  !
                </Typography>
              </Box>
            </FadeIn>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ fontSize: { xs: '1.35rem', sm: '2rem' } }}
            >
              Tableau de <GradientText variant="owner">bord</GradientText>
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

        {/* ═══ Hero stats — staggered entrance ═══ */}
        <StaggerList
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
          stagger={0.08}
        >
          <DashboardHeroStatCard
            title="Mes biens"
            value={adsCountLoading ? '—' : totalAds.toLocaleString('fr-FR')}
            numericValue={adsCountLoading ? undefined : totalAds}
            subtitle="Annonces publiées"
            icon={<HomeIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />}
            accentColor={TEAL}
            sparklineData={
              impressionsSpark.length
                ? impressionsSpark
                : Array(chartDays).fill(0)
            }
            loading={adsCountLoading || analyticsLoading}
          />
          <DashboardHeroStatCard
            title="Vues"
            value={
              analytics?.totals?.views != null
                ? analytics.totals.views.toLocaleString('fr-FR')
                : '0'
            }
            numericValue={analytics?.totals?.views ?? 0}
            subtitle={periodLabelFr(period)}
            icon={<VisibilityIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />}
            accentColor={TEAL}
            sparklineData={
              viewsSpark.length ? viewsSpark : Array(chartDays).fill(0)
            }
            loading={analyticsLoading}
            change={viewsChange}
          />
          <DashboardHeroStatCard
            title="Favoris"
            value={
              analytics?.totals?.favorites != null
                ? analytics.totals.favorites.toLocaleString('fr-FR')
                : '0'
            }
            numericValue={analytics?.totals?.favorites ?? 0}
            subtitle={periodLabelFr(period)}
            icon={<FavoriteIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />}
            accentColor={ROSE}
            sparklineData={
              favoritesSpark.length ? favoritesSpark : Array(chartDays).fill(0)
            }
            loading={analyticsLoading}
            change={favoritesChange}
          />
          <DashboardHeroStatCard
            title="Engagement"
            value={`${engagementRate.toFixed(1)}%`}
            subtitle={engagementSubtitle}
            icon={<EngagementIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />}
            accentColor={SKY}
            sparklineData={
              engagementSpark.length
                ? engagementSpark
                : Array(chartDays).fill(0)
            }
            loading={analyticsLoading}
            change={engagementChange}
          />
        </StaggerList>

        {/* ═══ Tab navigation ═══ */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              minHeight: 44,
            },
          }}
        >
          <Tab label="Vue d'ensemble" />
          <Tab label="Analytique" />
          <Tab label="Activité" />
        </Tabs>

        {/* ═══ Tab 0: Vue d'ensemble ═══ */}
        {tab === 0 && (
          <>
            {/* Profile completion widget */}
            <ProfileCompletionCard />

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
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <CalendarIcon
                          sx={{ color: 'primary.main', fontSize: 20 }}
                        />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Visites en attente
                        </Typography>
                        {pendingViewings.length > 0 && (
                          <Chip
                            label={pendingViewings.length}
                            size="small"
                            color="warning"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                            }}
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
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                        }}
                      >
                        {[1, 2, 3].map((i) => (
                          <Box
                            key={i}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1.5,
                            }}
                          >
                            <ShimmerBox
                              width={36}
                              height={36}
                              borderRadius={18}
                            />
                            <Box sx={{ flex: 1 }}>
                              <ShimmerBox
                                height={13}
                                width="55%"
                                sx={{ mb: 0.5 }}
                              />
                              <ShimmerBox height={11} width="75%" />
                            </Box>
                            <ShimmerBox
                              width={52}
                              height={20}
                              borderRadius={10}
                            />
                          </Box>
                        ))}
                      </Box>
                    ) : pendingViewings.length === 0 ? (
                      <EmptyState
                        variant="owner"
                        size="sm"
                        icon={<ClockIcon sx={{ fontSize: 22 }} />}
                        title="Aucune visite en attente"
                        description="Les demandes de visite s’afficheront ici."
                      />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                        }}
                      >
                        {pendingViewings.slice(0, 4).map((v, vIdx) => (
                          <Box
                            key={
                              v.id != null
                                ? String(v.id)
                                : `pending-viewing-${vIdx}`
                            }
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
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                noWrap
                              >
                                {v.client?.firstname} {v.client?.lastname}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                              >
                                {v.ad?.title} &middot; {formatDate(v.slot_date)}{' '}
                                {formatTime(v.slot_starts_at)}
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
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <HomeIcon
                          sx={{ color: 'primary.main', fontSize: 20 }}
                        />
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
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                        }}
                      >
                        {[1, 2, 3].map((i) => (
                          <Box
                            key={i}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1.5,
                            }}
                          >
                            <ShimmerBox
                              width={48}
                              height={36}
                              borderRadius={6}
                            />
                            <Box sx={{ flex: 1 }}>
                              <ShimmerBox
                                height={13}
                                width="60%"
                                sx={{ mb: 0.5 }}
                              />
                              <ShimmerBox height={11} width="45%" />
                            </Box>
                            <ShimmerBox
                              width={52}
                              height={20}
                              borderRadius={10}
                            />
                          </Box>
                        ))}
                      </Box>
                    ) : recentAds.length === 0 ? (
                      <EmptyState
                        variant="owner"
                        size="sm"
                        icon={<HomeIcon sx={{ fontSize: 22 }} />}
                        title="Aucune annonce"
                        description="Publiez votre première annonce pour commencer."
                        action={{
                          label: 'Créer une annonce',
                          onClick: () => router.push('/owner/ads/new'),
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                        }}
                      >
                        {recentAds.slice(0, 4).map((ad, adIdx) => {
                          const img = ad.images?.[0];
                          const imgUrl = img?.thumb || img?.url;
                          return (
                            <Box
                              key={
                                ad.id != null
                                  ? String(ad.id)
                                  : `recent-ad-${adIdx}`
                              }
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
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <HomeIcon
                                      sx={{
                                        fontSize: 18,
                                        color: 'text.disabled',
                                      }}
                                    />
                                  </Box>
                                )}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  noWrap
                                >
                                  {ad.title}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {ad.adresse || ad.quarter?.name || ''}
                                </Typography>
                              </Box>
                              <Chip
                                label={ad.status_label || ad.status}
                                size="small"
                                color={
                                  ad.status === 'available'
                                    ? 'success'
                                    : ad.status === 'pending' ||
                                        ad.status === 'reserved'
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
          </>
        )}

        {/* ═══ Tab 1: Analytique ═══ */}
        {tab === 1 && (
          <>
            {/* Area chart */}
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight={800}>
                    Vues sur mes annonces
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCSV}
                    disabled={!analytics?.top_ads?.length}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    CSV
                  </Button>
                </Box>
                {analyticsLoading ? (
                  <ShimmerBox
                    width="100%"
                    height={0}
                    sx={{
                      borderRadius: '16px',
                      paddingTop: { xs: '55%', sm: '48%', md: '42%' },
                      height: 'auto',
                    }}
                  />
                ) : (
                  <OwnerViewsFavoritesAreaChart data={chartSeries} />
                )}
              </CardContent>
            </Card>

            {analytics?.top_ads && analytics.top_ads.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <OwnerTopAdsTable
                  rows={analytics.top_ads}
                  periodLabel={periodLabelFr(period)}
                  onRowClick={(adId) => router.push(`/owner/ads/${adId}`)}
                />
              </Box>
            )}
          </>
        )}

        {/* ═══ Tab 2: Activité ═══ */}
        {tab === 2 && (
          <>
            {/* Pending viewings — full width */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon
                      sx={{ color: 'primary.main', fontSize: 20 }}
                    />
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
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                  >
                    {[1, 2, 3].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                        }}
                      >
                        <ShimmerBox width={36} height={36} borderRadius={18} />
                        <Box sx={{ flex: 1 }}>
                          <ShimmerBox
                            height={13}
                            width="55%"
                            sx={{ mb: 0.5 }}
                          />
                          <ShimmerBox height={11} width="75%" />
                        </Box>
                        <ShimmerBox width={52} height={20} borderRadius={10} />
                      </Box>
                    ))}
                  </Box>
                ) : pendingViewings.length === 0 ? (
                  <EmptyState
                    variant="owner"
                    size="sm"
                    icon={<ClockIcon sx={{ fontSize: 22 }} />}
                    title="Aucune visite en attente"
                    description="Les demandes de visite s'afficheront ici."
                  />
                ) : (
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                  >
                    {pendingViewings.map((v, vIdx) => (
                      <Box
                        key={
                          v.id != null
                            ? String(v.id)
                            : `pending-viewing-${vIdx}`
                        }
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
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                          >
                            {v.ad?.title} &middot; {formatDate(v.slot_date)}{' '}
                            {formatTime(v.slot_starts_at)}
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

            {/* Boost CTA */}
            {analytics?.totals?.conversion_rate != null &&
              analytics.totals.conversion_rate < 5 && (
                <Card
                  elevation={0}
                  sx={{
                    mt: 3,
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid size={{ xs: 12, md: 8 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            mb: 1,
                          }}
                        >
                          <BoostIcon sx={{ color: 'primary.main' }} />
                          <Typography
                            variant="h6"
                            fontWeight={800}
                            color="primary.main"
                          >
                            Boostez vos performances
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Votre taux de conversion est de{' '}
                          <strong>
                            {analytics.totals.conversion_rate.toFixed(1)}%
                          </strong>
                          . Les annonces boostées obtiennent en moyenne{' '}
                          <strong>3x plus de contacts</strong> qualifiés.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          {[
                            'Position prioritaire',
                            'Badge "Top Annonce"',
                            'Remontée quotidienne',
                          ].map((b) => (
                            <Box
                              key={b}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <CheckIcon
                                sx={{ fontSize: 16, color: 'success.main' }}
                              />
                              <Typography variant="caption" fontWeight={600}>
                                {b}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                      <Grid
                        size={{ xs: 12, md: 4 }}
                        sx={{ textAlign: { xs: 'left', md: 'right' } }}
                      >
                        <Button
                          variant="contained"
                          onClick={() => router.push('/owner/pro-services')}
                          sx={{
                            fontWeight: 700,
                            borderRadius: 3,
                            px: 4,
                            py: 1.5,
                            textTransform: 'none',
                            boxShadow: 'none',
                          }}
                        >
                          Découvrir les Boosts
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
          </>
        )}
      </Container>
    </>
  );
}
