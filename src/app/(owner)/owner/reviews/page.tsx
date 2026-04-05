'use client';

import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { ownerService, type OwnerReview } from '@/services/owner.service';
import { Star as StarIcon } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  Pagination,
  Skeleton,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

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

function Stars({ rating }: { rating: number }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          sx={{
            fontSize: 18,
            color: i <= rating ? 'warning.main' : 'action.disabled',
          }}
        />
      ))}
    </Box>
  );
}

export default function OwnerReviewsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['owner-reviews', page],
    queryFn: () => ownerService.getMyReviews({ page, per_page: 10 }),
  });

  const reviews = (data?.data ?? []) as OwnerReview[];
  const meta = data?.meta;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
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
        Les avis laissés par les locataires sur vos annonces.
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={100}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      ) : reviews.length === 0 ? (
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
            Aucun avis
          </Typography>
          <Typography color="text.secondary">
            Les avis apparaîtront ici lorsque des locataires évalueront vos
            annonces.
          </Typography>
        </Card>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reviews.map((r) => (
              <Card
                key={r.id}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar
                      sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}
                    >
                      {r.user?.firstname?.[0] || r.user?.lastname?.[0] || '?'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Stars rating={r.rating} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(r.created_at)}
                        </Typography>
                      </Box>
                      <Typography fontWeight={600}>
                        {r.user?.firstname} {r.user?.lastname}
                      </Typography>
                      {r.ad?.title && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          Sur : {r.ad.title}
                        </Typography>
                      )}
                      {r.comment && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {r.comment}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
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
    </Container>
  );
}
