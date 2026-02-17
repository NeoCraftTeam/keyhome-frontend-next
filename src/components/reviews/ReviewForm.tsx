'use client';

import { useAuth } from '@/providers/AuthProvider';
import { reviewsService } from '@/services/reviews.service';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Collapse,
    Divider,
    Rating,
    TextField,
    Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { useState } from 'react';

interface ReviewFormProps {
  adId: string;
  hasUserReviewed: boolean;
}

export default function ReviewForm({ adId, hasUserReviewed }: ReviewFormProps) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['ad', adId] });
    },
  });

  // Not logged in
  if (!isAuthenticated || !user) {
    return (
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 3 }} />
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            '& .MuiAlert-message': { fontSize: '0.9rem' },
          }}
        >
          Connectez-vous pour laisser un avis sur cette annonce.
        </Alert>
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
        <Alert
          severity="success"
          sx={{
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 22 },
          }}
        >
          Merci ! Votre avis a bien été enregistré.
        </Alert>
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Rating
          size="large"
          value={rating}
          onChange={(_, newValue) => setRating(newValue)}
          onChangeActive={(_, newHover) => setHoverRating(newHover)}
          sx={{
            '& .MuiRating-iconFilled': { color: '#FFB400' },
            '& .MuiRating-iconHover': { color: '#FFB400' },
            '& .MuiRating-icon': { fontSize: 32 },
          }}
        />
        <Collapse in={activeRating != null && activeRating > 0} orientation="horizontal">
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
            }}
          >
            {activeRating != null && activeRating > 0 ? labels[activeRating] : ''}
          </Typography>
        </Collapse>
      </Box>

      {/* Comment field */}
      <TextField
        multiline
        rows={3}
        fullWidth
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
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {getSafeErrorMessage(mutation.error, 'Une erreur est survenue. Veuillez réessayer.')}
        </Alert>
      )}

      {/* Submit button */}
      <Button
        variant="contained"
        disabled={!rating || mutation.isPending}
        onClick={() => mutation.mutate()}
        sx={{
          bgcolor: '#F6475F',
          '&:hover': { bgcolor: '#D5384E' },
          borderRadius: 2,
          px: 4,
          py: 1.2,
          fontWeight: 600,
          textTransform: 'none',
          fontSize: '0.95rem',
          boxShadow: '0 4px 12px rgba(246, 71, 95, 0.3)',
        }}
        startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
      >
        {mutation.isPending ? 'Envoi...' : 'Publier mon avis'}
      </Button>
    </Box>
  );
}
