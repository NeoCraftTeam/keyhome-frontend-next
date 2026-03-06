'use client';

import { Box, Skeleton } from '@mui/material';

/**
 * SkeletonCard — matches the exact shape of AdCard for zero-CLS loading states.
 * Uses MUI Skeleton with the shimmer wave animation.
 */
export default function SkeletonCard() {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Image placeholder — 3:2 ratio matching AdCard */}
      <Skeleton
        variant="rectangular"
        sx={{
          width: '100%',
          paddingTop: '66.67%',
          height: 0,
          borderRadius: '12px',
          transform: 'none',
        }}
        animation="wave"
      />

      {/* Text content placeholder */}
      <Box sx={{ pt: 1.25, pb: 0.5 }}>
        {/* Title line */}
        <Skeleton variant="text" width="75%" height={18} animation="wave" sx={{ borderRadius: 1 }} />

        {/* Location line */}
        <Skeleton variant="text" width="55%" height={15} animation="wave" sx={{ mt: 0.5, borderRadius: 1 }} />

        {/* Features row */}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Skeleton variant="text" width={32} height={14} animation="wave" sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" width={32} height={14} animation="wave" sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" width={48} height={14} animation="wave" sx={{ borderRadius: 1 }} />
        </Box>

        {/* Price line */}
        <Skeleton variant="text" width="40%" height={18} animation="wave" sx={{ mt: 0.5, borderRadius: 1 }} />
      </Box>
    </Box>
  );
}
