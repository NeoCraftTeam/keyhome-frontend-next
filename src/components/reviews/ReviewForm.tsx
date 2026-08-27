'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';
import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { useAuth } from '@/providers/AuthProvider';
import { reviewsService } from '@/services/reviews.service';
import {
  Box,
  Button,
  Collapse,
  Divider,
  Rating,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { brand } from '@/theme/tokens';

interface ReviewFormProps {
  adId: string;
  hasUserReviewed: boolean;
  /** Called after successful submission — use to invalidate the ad query in the parent. */
  onSuccess?: () => void;
}

export default function ReviewForm({
  adId,
  hasUserReviewed,
  onSuccess,
}: ReviewFormProps) {
  const { user, isAuthenticated } = useAuth();

  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number>(-1);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const labels: Record<number, string> = {
    1: 'Mauvais',
    2: 'Passable',
    3: 'Correct',
    4: 'Bien',
    5: 'Excellent',
  };

  const mutation = useMutation({
    mutationFn: () =>
      reviewsService.create({
        rating: rating!,
        comment: comment.trim() || undefined,
        ad_id: adId,
      }),
    onSuccess: () => {
      setSubmitted(true);
      onSuccess?.();
    },
  });

  // Not logged in
  if (!isAuthenticated || !user) {
    return (
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 3 }} />
        <AppAlert
          severity="info"
          message="Connectez-vous pour laisser un avis sur cette annonce."
        />
      </Box>
    );
  }

  // Already reviewed
  if (hasUserReviewed && !submitted) {
    return null; // silently hide — user already sees their review in the list
  }

  // Success state
  if (submitted) {
    return (
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 3 }} />
        <AppAlert
          severity="success"
          message="Merci ! Votre avis a bien été enregistré."
        />
      </Box>
    );
  }

  const activeRating = hoverRating !== -1 ? hoverRating : rating;

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 3 }} />
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Laisser un avis
      </Typography>

      {/* Star rating */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Rating
          size="large"
          value={rating}
          onChange={(_, newValue) => setRating(newValue)}
          onChangeActive={(_, newHover) => setHoverRating(newHover)}
          sx={{
            '& .MuiRating-iconFilled': { color: brand.primary },
            '& .MuiRating-iconHover': { color: brand.primary },
            '& .MuiRating-icon': { fontSize: { xs: 28, sm: 32 } },
          }}
        />
        <Collapse
          in={activeRating != null && activeRating > 0}
          orientation="horizontal"
        >
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{
              color: 'text.secondary',
              bgcolor: 'action.hover',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              whiteSpace: 'nowrap',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
            }}
          >
            {activeRating != null && activeRating > 0
              ? labels[activeRating]
              : ''}
          </Typography>
        </Collapse>
      </Box>

      {/* Comment field */}
      <TextField
        multiline
        minRows={2}
        maxRows={5}
        fullWidth
        label="Votre commentaire"
        placeholder="Partagez votre expérience (optionnel)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        inputProps={{ maxLength: 1000 }}
        helperText={`${comment.length}/1000`}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />

      {/* Error feedback */}
      {mutation.isError && (
        <AppAlert
          severity="error"
          sx={{ mb: 2 }}
          message={getSafeErrorMessage(
            mutation.error,
            'Une erreur est survenue. Veuillez réessayer.'
          )}
        />
      )}

      {/* Submit button */}
      <Button
        variant="contained"
        fullWidth
        disabled={!rating || mutation.isPending}
        onClick={() => mutation.mutate()}
        sx={{
          bgcolor: brand.primary,
          '&:hover': { bgcolor: '#D5384E' },
          borderRadius: 2,
          px: 4,
          py: 1.2,
          fontWeight: 600,
          textTransform: 'none',
          fontSize: '0.95rem',
          boxShadow: '0 4px 12px rgba(246, 71, 95, 0.3)',
          mb: { xs: 2, md: 0 },
          maxWidth: { md: 'fit-content' },
        }}
        startIcon={mutation.isPending ? <ButtonSpinner size={18} /> : null}
      >
        {mutation.isPending ? 'Envoi...' : 'Publier mon avis'}
      </Button>
    </Box>
  );
}
