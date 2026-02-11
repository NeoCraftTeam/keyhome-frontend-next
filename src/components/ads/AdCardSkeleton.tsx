'use client';

import { Box, Skeleton } from '@mui/material';

export default function AdCardSkeleton() {
  return (
    <Box sx={{ width: '100%' }}>
      <Skeleton
        variant="rounded"
        sx={{
          width: '100%',
          paddingTop: '66.67%',
          borderRadius: 3,
        }}
      />
      <Box sx={{ mt: 1.5 }}>
        <Skeleton variant="text" width="70%" sx={{ fontSize: '1rem' }} />
        <Skeleton variant="text" width="50%" sx={{ fontSize: '0.875rem' }} />
        <Skeleton variant="text" width="40%" sx={{ fontSize: '0.875rem' }} />
        <Skeleton variant="text" width="35%" sx={{ fontSize: '1rem' }} />
      </Box>
    </Box>
  );
}
