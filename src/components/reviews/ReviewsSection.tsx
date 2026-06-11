'use client';

import { formatRelativeDate } from '@/lib/constants';
import type { Review } from '@/types';
import Close from '@mui/icons-material/Close';
import Search from '@mui/icons-material/Search';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  Divider,
  Grid,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number | null;
  reviewsCount?: number;
}

export default function ReviewsSection({
  reviews,
  averageRating,
  reviewsCount: reviewsCountProp,
}: ReviewsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const reviewsCount = reviewsCountProp ?? reviews.length;

  const ratingBreakdown: Record<number, number> = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };
  for (const review of reviews) {
    const rounded = Math.min(5, Math.max(1, Math.round(review.rating)));
    ratingBreakdown[rounded] += 1;
  }

  const filteredReviews = useMemo(() => {
    const query = reviewSearch.trim().toLowerCase();
    if (!query) {
      return reviews;
    }
    return reviews.filter((review) => {
      const author = review.user?.name?.toLowerCase() ?? '';
      const comment = review.comment?.toLowerCase() ?? '';
      return author.includes(query) || comment.includes(query);
    });
  }, [reviews, reviewSearch]);

  if (reviews.length === 0) {
    return null;
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Divider sx={{ mb: 3 }} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Avis
          </Typography>
          {averageRating != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                role="img"
                aria-label={`Note moyenne : ${averageRating.toFixed(1)} sur 5`}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <Box
                    key={s}
                    component="span"
                    aria-hidden="true"
                    sx={{
                      color:
                        s <= Math.round(averageRating)
                          ? '#FFB400'
                          : 'action.disabled',
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                  >
                    ★
                  </Box>
                ))}
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ ml: 0.5 }}>
                {averageRating.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({reviewsCount} avis)
              </Typography>
            </Box>
          )}
        </Box>
        <Button
          variant="text"
          size="small"
          onClick={() => setIsDialogOpen(true)}
          sx={{
            px: 0,
            mb: 1.5,
            minWidth: 0,
            textTransform: 'none',
            fontWeight: 700,
            color: 'text.primary',
            textDecoration: 'underline',
            textDecorationColor: 'divider',
            textUnderlineOffset: '3px',
            // Active scale gives this CTA a touch-feedback signal on
            // mobile where the underline-color hover state is invisible.
            transition: 'transform 0.12s ease',
            '&:hover': {
              bgcolor: 'transparent',
              textDecorationColor: 'text.primary',
            },
            '&:active': {
              transform: 'scale(0.97)',
            },
          }}
        >
          Voir tous les commentaires
        </Button>
      </Box>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        disableScrollLock={false}
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <IconButton
            aria-label="Fermer les commentaires"
            onClick={() => setIsDialogOpen(false)}
          >
            <Close />
          </IconButton>
        </Box>
        <Box
          sx={{
            p: { xs: 2, md: 4 },
            overflowY: 'auto',
            flex: 1,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                sx={{
                  fontSize: { xs: '1.6rem', sm: '2rem', md: '2.2rem' },
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                <Box component="span" aria-hidden="true">
                  ★
                </Box>{' '}
                {averageRating?.toFixed(2).replace('.', ',') ?? '—'}
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Évaluation globale
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingBreakdown[star];
                  const percent = reviews.length
                    ? (count / reviews.length) * 100
                    : 0;
                  return (
                    <Box
                      key={star}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '18px 1fr 38px',
                        gap: 1,
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {star}
                      </Typography>
                      <Box
                        sx={{
                          height: 6,
                          borderRadius: 99,
                          bgcolor: 'action.hover',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${percent}%`,
                            height: '100%',
                            bgcolor: 'primary.main',
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {count}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography
                sx={{
                  fontSize: { xs: '1.8rem', md: '2rem' },
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {reviewsCount} commentaire{reviewsCount > 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Fonctionnement des commentaires
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<Search />}
                  disableRipple
                  sx={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    borderRadius: 999,
                    px: 2,
                    py: 1.1,
                    color: 'text.secondary',
                    borderColor: 'divider',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: 'divider',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box
                    component="input"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="Rechercher dans tous les commentaires"
                    aria-label="Rechercher dans les commentaires"
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      font: 'inherit',
                      color: 'inherit',
                    }}
                  />
                </Button>
              </Box>
              <Box
                sx={{
                  maxHeight: { xs: 'none', md: '60vh' },
                  overflowY: { xs: 'visible', md: 'auto' },
                  overscrollBehavior: 'contain',
                  pr: 1,
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {filteredReviews.map((review) => (
                  <Box key={review.id} sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 1,
                      }}
                    >
                      <Avatar src={review.user?.avatar || undefined}>
                        {review.user?.name?.charAt(0) || '?'}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{ lineHeight: 1.2 }}
                        >
                          {review.user?.name || 'Utilisateur'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeDate(review.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      role="img"
                      aria-label={`Note : ${review.rating} sur 5`}
                      sx={{ display: 'flex', gap: 0.25, mb: 0.6 }}
                    >
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Box
                          key={s}
                          component="span"
                          aria-hidden="true"
                          sx={{
                            color:
                              s <= review.rating
                                ? 'primary.main'
                                : 'action.disabled',
                            fontSize: 14,
                          }}
                        >
                          ★
                        </Box>
                      ))}
                    </Box>
                    {review.comment && (
                      <Typography
                        variant="body1"
                        sx={{
                          lineHeight: 1.55,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {review.comment}
                      </Typography>
                    )}
                  </Box>
                ))}
                {filteredReviews.length === 0 && (
                  <Typography color="text.secondary">
                    Aucun commentaire trouvé.
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Dialog>
    </>
  );
}
