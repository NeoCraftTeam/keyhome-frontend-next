'use client';

import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { ownerService, type OwnerReview } from '@/services/owner.service';
import { getSafeErrorMessage } from '@/lib/error-messages';
import {
  CheckCircle as CheckCircleIcon,
  ChatBubbleOutline as ChatBubbleIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  MenuItem,
  Pagination,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import FadeIn from '@/components/ui/FadeIn';
import { brandAgent, neutral } from '@/theme/tokens';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const REPLY_MAX = 1000;

function formatDate(s: string): string {
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

function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <Box
      sx={{ display: 'flex', gap: 0.25 }}
      aria-label={`${rating} étoile${rating > 1 ? 's' : ''} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating ? (
          <StarIcon key={i} sx={{ fontSize: size, color: 'warning.main' }} />
        ) : (
          <StarBorderIcon
            key={i}
            sx={{ fontSize: size, color: 'action.disabled' }}
          />
        )
      )}
    </Box>
  );
}

interface ReviewCardProps {
  review: OwnerReview;
  onReply: (review: OwnerReview) => void;
  respondGloballyBusy: boolean;
}

function ReviewCard({ review, onReply, respondGloballyBusy }: ReviewCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
            {review.user?.firstname?.[0] ?? review.user?.lastname?.[0] ?? '?'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5,
                flexWrap: 'wrap',
              }}
            >
              <Stars rating={review.rating} />
              <Typography variant="caption" color="text.secondary">
                {formatDate(review.created_at)}
              </Typography>
              {review.is_verified && (
                <Chip
                  size="small"
                  color="success"
                  variant="outlined"
                  icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                  label="Vérifié"
                />
              )}
            </Box>
            <Typography fontWeight={600}>
              {review.user?.firstname} {review.user?.lastname}
            </Typography>
            {review.ad?.title && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={review.ad.title}
              >
                Sur : {review.ad.title}
              </Typography>
            )}
            {review.comment && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {review.comment}
              </Typography>
            )}

            {review.owner_response ? (
              <Box
                sx={{
                  mt: 1.5,
                  pl: 2,
                  borderLeft: '3px solid',
                  borderColor: 'primary.main',
                  bgcolor: alpha(brandAgent.primary, 0.04),
                  py: 1,
                  pr: 1.5,
                  borderRadius: '0 8px 8px 0',
                }}
              >
                <Typography
                  variant="caption"
                  color="primary.main"
                  fontWeight={700}
                  sx={{ display: 'block', mb: 0.25 }}
                >
                  Votre réponse · {formatDate(review.owner_responded_at ?? '')}
                </Typography>
                <Typography variant="body2">{review.owner_response}</Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 1.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ChatBubbleIcon fontSize="small" />}
                  onClick={() => onReply(review)}
                  disabled={respondGloballyBusy}
                >
                  Répondre
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface ReviewKpiProps {
  reviews: OwnerReview[];
}

function ReviewKpi({ reviews }: ReviewKpiProps) {
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => Math.round(r.rating) === stars).length,
  }));

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        mb: 3,
      }}
    >
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack
              spacing={0.5}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Typography variant="h2" fontWeight={800} color="primary.main">
                {avg ? avg.toFixed(1) : '—'}
              </Typography>
              <Stars rating={Math.round(avg)} size={22} />
              <Typography variant="caption" color="text.secondary">
                {total} avis sur cette page
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Stack spacing={0.5}>
              {distribution.map(({ stars, count }) => {
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <Box
                    key={stars}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ width: 36 }}
                      aria-hidden
                    >
                      {stars}★
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 8,
                          borderRadius: 99,
                          bgcolor: alpha(neutral.black, 0.06),
                          '& .MuiLinearProgress-bar': { borderRadius: 99 },
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ width: 28, textAlign: 'right' }}
                    >
                      {count}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function OwnerReviewsPage() {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>(
    'all'
  );
  const [ratingFilter, setRatingFilter] = useState<'all' | string>('all');
  const [replyTarget, setReplyTarget] = useState<OwnerReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const { data, isLoading, isError, isFetched, refetch, isFetching } = useQuery(
    {
      queryKey: ['owner-reviews', page],
      queryFn: ({ signal }) =>
        ownerService.getMyReviews({ page, per_page: 10 }, { signal }),
    }
  );

  const listLoadFailed = isFetched && isError;

  const reviews = useMemo(
    () => (data?.data ?? []) as OwnerReview[],
    [data?.data]
  );
  const meta = data?.meta;

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filter === 'unanswered' && r.owner_response) return false;
      if (filter === 'answered' && !r.owner_response) return false;
      if (
        ratingFilter !== 'all' &&
        Math.round(r.rating) !== Number(ratingFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [reviews, filter, ratingFilter]);

  const respondMutation = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      ownerService.respondToReview(id, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-reviews'] });
      setReplyTarget(null);
      setReplyText('');
      setSnackbar({ message: 'Réponse publiée.', severity: 'success' });
    },
    onError: (err) => {
      setSnackbar({
        message: getSafeErrorMessage(err, 'Échec de la publication.'),
        severity: 'error',
      });
    },
  });

  const handleSendReply = (): void => {
    if (!replyTarget || !replyText.trim()) return;
    respondMutation.mutate({
      id: replyTarget.id,
      response: replyText.trim(),
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <FadeIn>
        <PageBreadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/owner/dashboard' },
            { label: 'Avis' },
          ]}
        />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Avis clients
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Les avis laissés par les locataires sur vos annonces. Répondre
          augmente votre Trust Score et rassure les futurs locataires.
        </Typography>
      </FadeIn>

      {listLoadFailed && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              disabled={isFetching || !isOnline}
              onClick={() => void refetch()}
            >
              Réessayer
            </Button>
          }
        >
          {!isOnline
            ? 'Vous semblez hors ligne. Reconnectez-vous puis réessayez.'
            : 'Impossible de charger vos avis pour le moment.'}
        </Alert>
      )}

      {!listLoadFailed && !isLoading && reviews.length > 0 && (
        <ReviewKpi reviews={reviews} />
      )}

      {/* Filters */}
      {!listLoadFailed && reviews.length > 0 && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ mb: 2 }}
          alignItems={{ sm: 'center' }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filter}
            onChange={(_, v) =>
              v && setFilter(v as 'all' | 'unanswered' | 'answered')
            }
            aria-label="Filtre des avis"
          >
            <ToggleButton value="all">Tous</ToggleButton>
            <ToggleButton value="unanswered">Sans réponse</ToggleButton>
            <ToggleButton value="answered">Répondus</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            size="small"
            select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            sx={{ minWidth: 160 }}
            aria-label="Filtre par note"
          >
            <MenuItem value="all">Toutes les notes</MenuItem>
            {[5, 4, 3, 2, 1].map((s) => (
              <MenuItem key={s} value={String(s)}>
                {s} étoile{s > 1 ? 's' : ''}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={120}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      ) : listLoadFailed ? null : reviews.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            p: 6,
            textAlign: 'center',
          }}
        >
          <StarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Aucun avis pour le moment
          </Typography>
          <Typography color="text.secondary">
            Les avis apparaîtront ici lorsque des locataires évalueront vos
            annonces. Encouragez-les à laisser un avis après une visite.
          </Typography>
        </Card>
      ) : filtered.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="body1">
            Aucun avis ne correspond aux filtres sélectionnés.
          </Typography>
        </Card>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                onReply={setReplyTarget}
                respondGloballyBusy={respondMutation.isPending}
              />
            ))}
          </Box>
          {meta && meta.last_page > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={meta.last_page}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Reply dialog */}
      <Dialog
        open={!!replyTarget}
        onClose={() => {
          if (!respondMutation.isPending) {
            setReplyTarget(null);
            setReplyText('');
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Répondre à l&apos;avis</DialogTitle>
        <DialogContent>
          {replyTarget && (
            <Box sx={{ mb: 2 }}>
              <Stars rating={replyTarget.rating} size={16} />
              {replyTarget.comment && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  «&nbsp;{replyTarget.comment}&nbsp;»
                </Typography>
              )}
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Remerciez le locataire, apportez un complément d'information…"
            inputProps={{ maxLength: REPLY_MAX }}
            helperText={`${replyText.length} / ${REPLY_MAX}`}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setReplyTarget(null);
              setReplyText('');
            }}
            disabled={respondMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            disabled={respondMutation.isPending || !replyText.trim()}
            onClick={handleSendReply}
          >
            Publier la réponse
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}
