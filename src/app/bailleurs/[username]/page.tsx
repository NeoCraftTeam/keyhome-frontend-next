'use client';

import {
  usersService,
  PublicUserProfile,
  PublicReview,
} from '@/services/users.service';
import { Ad } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Rating,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Bolt from '@mui/icons-material/Bolt';
import Business from '@mui/icons-material/Business';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import Home from '@mui/icons-material/Home';
import LocationOn from '@mui/icons-material/LocationOn';
import Person from '@mui/icons-material/Person';
import Star from '@mui/icons-material/Star';
import AdCard from '@/components/ads/AdCard';
import AppLoader from '@/components/ui/AppLoader';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/lib/api';
import TrustScoreBadge from '@/components/trust/TrustScoreBadge';
import TrustScoreSection from '@/components/trust/TrustScoreSection';

function useFollowBailleur(username: string) {
  const { user: currentUser } = useAuth();
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !username) return;
    api
      .get<{ following: boolean; followers_count: number }>(
        `/v1/bailleurs/${username}/follow`
      )
      .then(({ data }) => {
        setFollowing(data.following);
        setFollowersCount(data.followers_count);
      })
      .catch(() => {});
  }, [username, currentUser]);

  const toggle = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { data } = await api.post<{
        following: boolean;
        followers_count: number;
      }>(`/v1/bailleurs/${username}/follow`);
      setFollowing(data.following);
      setFollowersCount(data.followers_count);
    } catch {
      /* ignore — leave state unchanged */
    } finally {
      setLoading(false);
    }
  }, [username, currentUser]);

  return {
    following,
    toggle,
    loading,
    followersCount,
    isAuthenticated: !!currentUser,
  };
}

function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <Card
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Avatar
            sx={{
              width: 30,
              height: 30,
              bgcolor: 'primary.main',
              fontSize: 13,
            }}
          >
            {review.reviewer_name?.[0]?.toUpperCase() ?? '?'}
          </Avatar>
          <Typography variant="body2" fontWeight={600}>
            {review.reviewer_name}
          </Typography>
          <Box
            sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                sx={{
                  fontSize: 14,
                  color:
                    i <= review.rating ? 'warning.main' : 'action.disabled',
                }}
              />
            ))}
          </Box>
        </Box>
        {review.ad_title && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.5 }}
          >
            {review.ad_title}
          </Typography>
        )}
        <Typography
          variant="body2"
          sx={{ fontStyle: 'italic', color: 'text.secondary' }}
        >
          &ldquo;{review.comment}&rdquo;
        </Typography>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', mt: 0.5 }}
        >
          {format(new Date(review.created_at), 'dd MMM yyyy', { locale: fr })}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function BailleurPublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-public-profile', username],
    queryFn: () => usersService.getPublicProfile(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });

  const profile: PublicUserProfile | undefined = data?.data;
  const ads: Ad[] = data?.ads ?? [];
  const meta = data?.meta;

  const {
    following,
    toggle: toggleFollow,
    loading: followLoading,
    followersCount,
    isAuthenticated,
  } = useFollowBailleur(username);

  if (isLoading) {
    return <AppLoader fullPage />;
  }

  if (isError || !profile) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Profil introuvable
        </Typography>
        <Typography color="text.secondary">
          Ce propriétaire n&apos;existe pas ou son profil a été supprimé.
        </Typography>
      </Container>
    );
  }

  const memberSince = profile.member_since
    ? formatDistanceToNow(new Date(profile.member_since), {
        addSuffix: false,
        locale: fr,
      })
    : null;

  const isAgency = profile.type === 'agency' && profile.agency;
  const { avg_rating, total_reviews } = profile.review_stats;
  const hasReviews = total_reviews > 0;
  const recentReviews: PublicReview[] = profile.recent_reviews ?? [];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <PageBreadcrumbs
        showBack
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Bailleurs' },
          { label: profile.display_name },
        ]}
      />

      {/* Profile Header Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: 3,
          }}
        >
          {/* Avatar */}
          <Avatar
            src={profile.avatar || undefined}
            alt={profile.display_name}
            sx={{
              width: { xs: 88, md: 110 },
              height: { xs: 88, md: 110 },
              bgcolor: 'primary.main',
              fontSize: { xs: 36, md: 44 },
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {profile.firstname?.charAt(0)?.toUpperCase()}
          </Avatar>

          {/* Main info */}
          <Box
            sx={{
              flex: 1,
              textAlign: { xs: 'center', sm: 'left' },
              minWidth: 0,
            }}
          >
            {/* Name + verified */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: { xs: 'center', sm: 'flex-start' },
                flexWrap: 'wrap',
                mb: 0.5,
              }}
            >
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
              >
                {profile.display_name}
              </Typography>
              {profile.is_verified && (
                <Tooltip title="Bailleur Vérifié">
                  <CheckCircle sx={{ color: 'success.main', fontSize: 22 }} />
                </Tooltip>
              )}
            </Box>

            {/* Verified label */}
            {profile.is_verified && (
              <Typography
                variant="caption"
                color="success.main"
                fontWeight={600}
                sx={{ display: 'block', mb: 1 }}
              >
                Bailleur Vérifié
              </Typography>
            )}

            {/* TrustScore badge */}
            {profile.trust_score && (
              <Box sx={{ mb: 1 }}>
                <TrustScoreBadge
                  trustScore={profile.trust_score}
                  size="medium"
                />
              </Box>
            )}

            {/* Type badge */}
            {isAgency ? (
              <Chip
                icon={<Business sx={{ fontSize: 14 }} />}
                label={profile.agency!.name}
                size="small"
                color="primary"
                variant="outlined"
                component={Link}
                href={`/agences/${profile.agency!.id}`}
                clickable
                sx={{ borderRadius: '20px', mb: 1.5 }}
              />
            ) : (
              <Chip
                icon={<Person sx={{ fontSize: 14 }} />}
                label="Propriétaire indépendant"
                size="small"
                variant="outlined"
                sx={{ borderRadius: '20px', mb: 1.5 }}
              />
            )}

            {/* Bio — rendered as markdown */}
            {profile.bio && (
              <Box
                sx={{
                  mb: 1.5,
                  maxWidth: 560,
                  '& p': {
                    my: 0.5,
                    lineHeight: 1.7,
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                  },
                  '& h1, & h2, & h3': {
                    fontWeight: 700,
                    mt: 1.5,
                    mb: 0.5,
                    fontSize: '0.95rem',
                  },
                  '& ul, & ol': { pl: 2.5, my: 0.5 },
                  '& li': {
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    lineHeight: 1.7,
                  },
                  '& strong': { fontWeight: 700, color: 'text.primary' },
                  '& em': { fontStyle: 'italic' },
                  '& a': { color: 'primary.main', textDecoration: 'underline' },
                  '& code': {
                    bgcolor: 'action.hover',
                    px: 0.5,
                    borderRadius: 1,
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                  },
                }}
              >
                <ReactMarkdown>{profile.bio}</ReactMarkdown>
              </Box>
            )}

            {/* Rating */}
            {hasReviews && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1.5,
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                }}
              >
                <Rating
                  value={avg_rating}
                  precision={0.1}
                  readOnly
                  size="small"
                />
                <Typography variant="body2" fontWeight={700}>
                  {avg_rating.toFixed(1)}/5
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({total_reviews} avis)
                </Typography>
              </Box>
            )}

            {/* Chips row */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', sm: 'flex-start' },
              }}
            >
              {profile.response_time_label && (
                <Chip
                  icon={<Bolt sx={{ fontSize: 15 }} />}
                  label={profile.response_time_label}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ borderRadius: '20px' }}
                />
              )}
              {memberSince && (
                <Chip
                  icon={<CalendarMonth sx={{ fontSize: 15 }} />}
                  label={`Membre depuis ${memberSince}`}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: '20px' }}
                />
              )}
              {profile.city_name && (
                <Chip
                  icon={<LocationOn sx={{ fontSize: 15 }} />}
                  label={profile.city_name}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: '20px' }}
                />
              )}
              <Chip
                icon={<Home sx={{ fontSize: 15 }} />}
                label={`${profile.total_active_ads} annonce${profile.total_active_ads > 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
                sx={{ borderRadius: '20px' }}
              />
            </Box>
          </Box>

          {/* Favoris button */}
          <Box
            sx={{
              flexShrink: 0,
              alignSelf: { xs: 'center', sm: 'flex-start' },
              textAlign: 'center',
            }}
          >
            <Button
              variant={following ? 'contained' : 'outlined'}
              color={following ? 'primary' : 'inherit'}
              startIcon={following ? <Favorite /> : <FavoriteBorder />}
              onClick={isAuthenticated ? toggleFollow : undefined}
              disabled={followLoading || (!isAuthenticated && false)}
              href={!isAuthenticated ? '/login' : undefined}
              size="medium"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '20px',
                minWidth: 172,
              }}
            >
              {following ? 'Retiré des favoris' : 'Mettre en favoris'}
            </Button>
            {followersCount !== null && followersCount > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                {followersCount} favori{followersCount > 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left: listings */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="h5" fontWeight={700}>
              Ses annonces ({meta?.total ?? ads.length})
            </Typography>
          </Box>

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
                Ce bailleur n&apos;a pas encore publié d&apos;annonces.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={isMobile ? 1 : 2}>
              {ads.map((ad) => (
                <Grid key={ad.id} size={{ xs: 6, sm: 6, md: 4 }}>
                  <AdCard ad={ad} />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Right: trust score + reviews */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* TrustScore breakdown */}
          <TrustScoreSection userId={profile.id} />

          <Typography variant="h5" fontWeight={700} sx={{ mb: 2, mt: 3 }}>
            Avis locataires
          </Typography>

          {recentReviews.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <Star sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Aucun avis pour le moment.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {recentReviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
              {total_reviews > recentReviews.length && (
                <>
                  <Divider />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                  >
                    +{total_reviews - recentReviews.length} avis supplémentaires
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
