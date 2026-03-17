'use client';

import { Box, Skeleton } from '@mui/material';

export default function AdCardSkeleton() {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Image placeholder */}
      <Skeleton
        variant="rounded"
        animation="wave"
        sx={{
          width: '100%',
          paddingTop: '66.67%',
          borderRadius: '12px',
          transform: 'none',
        }}
      />

      {/* Text content */}
      <Box sx={{ mt: 1.25, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {/* Title row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Skeleton animation="wave" variant="text" width="65%" sx={{ fontSize: '0.875rem', transform: 'none', borderRadius: 1 }} />
          <Skeleton animation="wave" variant="text" width="16%" sx={{ fontSize: '0.75rem', transform: 'none', borderRadius: 1 }} />
        </Box>

        {/* Location */}
        <Skeleton animation="wave" variant="text" width="50%" sx={{ fontSize: '0.8rem', transform: 'none', borderRadius: 1 }} />

        {/* Features row */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25 }}>
          <Skeleton animation="wave" variant="text" width="18%" sx={{ fontSize: '0.72rem', transform: 'none', borderRadius: 1 }} />
          <Skeleton animation="wave" variant="text" width="18%" sx={{ fontSize: '0.72rem', transform: 'none', borderRadius: 1 }} />
          <Skeleton animation="wave" variant="text" width="22%" sx={{ fontSize: '0.72rem', transform: 'none', borderRadius: 1 }} />
        </Box>

        {/* Price row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.25 }}>
          <Skeleton animation="wave" variant="text" width="40%" sx={{ fontSize: '0.875rem', transform: 'none', borderRadius: 1 }} />
          <Skeleton animation="wave" variant="rounded" width={36} height={20} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
    </Box>
  );
}
